#!/usr/bin/env python3
import argparse
import csv
import fnmatch
import hashlib
import html
import json
import os
import re
import shlex
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import time
import unicodedata
import uuid
import zipfile
from collections import deque
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path
import platform
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple

SCRIPT_DIR = Path(__file__).resolve().parent
VAULT_DIR = SCRIPT_DIR.parent
ROOT_DIR = VAULT_DIR.parent
CONFIG_PATH = VAULT_DIR / "config" / "vault.config.json"
SCHEMA_PATH = VAULT_DIR / "schema" / "001_init.sql"

SEVERITY_ALIASES = {
    "info": "info",
    "notice": "notice",
    "warn": "warning",
    "warning": "warning",
    "blocker": "critical",
    "critical": "critical",
    "fatal": "fatal",
}
SEVERITY_CHOICES = sorted(SEVERITY_ALIASES.keys())
FAILURE_SEVERITIES = {"warning", "critical", "fatal"}

EVENT_TAXONOMY = {
    "SYSTEM",
    "INGEST",
    "DOC",
    "TASK",
    "GIT",
    "SEAL",
    "VERIFY",
    "BACKUP",
    "RESTORE",
    "SECURITY",
    "CONFIG",
}


def now_utc_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def load_config(config_path: Path) -> Dict[str, Any]:
    if not config_path.exists():
        raise ValueError(f"Missing config file: {config_path}")
    try:
        config = json.loads(config_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON config at {config_path}: {exc}") from exc
    if not isinstance(config, dict):
        raise ValueError("Config root must be an object")
    return config


def resolve_path(raw_path: str) -> Path:
    path_obj = Path(raw_path).expanduser()
    if path_obj.is_absolute():
        return path_obj.resolve()
    return (ROOT_DIR / path_obj).resolve()


def resolve_db_path(config_path: Path, explicit_db_path: Optional[str]) -> Path:
    if explicit_db_path:
        return resolve_path(explicit_db_path)

    config = load_config(config_path)
    raw = config.get("vaultDbPath")
    if not isinstance(raw, str) or not raw.strip():
        raise ValueError("Config must include non-empty 'vaultDbPath'")
    return resolve_path(raw)


def get_repo_entries(config: Dict[str, Any]) -> List[Dict[str, Any]]:
    repos = config.get("repos", [])
    if not isinstance(repos, list):
        raise ValueError("config.repos must be a list")
    if not repos:
        return [{"name": "swd-os", "path": str(ROOT_DIR)}]

    parsed: List[Dict[str, Any]] = []
    for repo in repos:
        if not isinstance(repo, dict):
            continue
        name = repo.get("name")
        path = repo.get("path")
        if not isinstance(name, str) or not name.strip():
            continue
        if not isinstance(path, str) or not path.strip():
            continue
        parsed.append(
            {
                "name": name.strip(),
                "path": path.strip(),
                "include": repo.get("include", repo.get("allow", [])),
                "exclude": repo.get("exclude", repo.get("deny", [])),
                "commands": repo.get("commands", {}),
            }
        )
    return parsed or [{"name": "swd-os", "path": str(ROOT_DIR)}]


def select_repos(config: Dict[str, Any], project: Optional[str], include_all: bool) -> List[Dict[str, Any]]:
    repos = get_repo_entries(config)
    if include_all or not project:
        return repos
    selected = [repo for repo in repos if repo["name"] == project]
    if not selected:
        raise ValueError(f"Project '{project}' not found in config.repos")
    return selected


def repo_path_for_project(config: Dict[str, Any], project: str) -> Optional[Path]:
    for repo in get_repo_entries(config):
        if repo["name"] == project:
            return resolve_path(repo["path"])
    return None


def connect(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def get_table_columns(conn: sqlite3.Connection, table_name: str) -> List[str]:
    rows = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
    return [str(row["name"]) for row in rows]


def ensure_phase1_schema_compat(conn: sqlite3.Connection) -> None:
    row = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='events'").fetchone()
    if not row:
        return

    expected = [
        "id",
        "ts",
        "type",
        "project",
        "severity",
        "summary",
        "details_json",
        "evidence_paths_json",
        "source",
        "prev_hash",
        "hash",
    ]
    current = get_table_columns(conn, "events")
    if current == expected:
        return

    conn.executescript(
        """
        DROP TABLE IF EXISTS events;
        DROP TABLE IF EXISTS checkpoints;
        DROP TABLE IF EXISTS sources;
        DROP TABLE IF EXISTS schema_migrations;
        """
    )
    conn.commit()


def parse_json_object(value: Optional[str], label: str) -> Dict[str, Any]:
    if not value:
        return {}
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid {label} JSON: {exc}") from exc
    if not isinstance(parsed, dict):
        raise ValueError(f"{label} must be a JSON object")
    return parsed


def parse_json_array(value: Optional[str], label: str) -> List[Any]:
    if not value:
        return []
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid {label} JSON: {exc}") from exc
    if not isinstance(parsed, list):
        raise ValueError(f"{label} must be a JSON array")
    return parsed


def parse_since(since: str) -> Tuple[Optional[str], Optional[str]]:
    normalized = since.strip().lower()
    if not normalized:
        return None, None
    if normalized.endswith("d") and normalized[:-1].isdigit():
        return "relative", f"-{int(normalized[:-1])} days"
    if normalized.endswith("h") and normalized[:-1].isdigit():
        return "relative", f"-{int(normalized[:-1])} hours"
    if normalized.endswith("m") and normalized[:-1].isdigit():
        return "relative", f"-{int(normalized[:-1])} minutes"
    return "absolute", normalized


def normalize_ts(timestamp: str) -> str:
    raw = timestamp.strip()
    if not raw:
        return now_utc_iso()
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return raw
    if dt.tzinfo:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def normalize_error_message(message: str) -> str:
    text = message.lower()
    text = re.sub(r"0x[0-9a-f]+", "<hex>", text)
    text = re.sub(r"\b\d+\b", "<num>", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:400]


def normalize_severity(value: str) -> str:
    raw = str(value or "").strip().lower()
    normalized = SEVERITY_ALIASES.get(raw)
    if not normalized:
        raise ValueError(f"Unsupported severity '{value}'. Allowed: {', '.join(SEVERITY_CHOICES)}")
    return normalized


def classify_event_taxonomy(event_type: str, source: str, details: Dict[str, Any]) -> str:
    ev = str(event_type or "").strip().lower()
    src = str(source or "").strip().lower()
    explicit = str(details.get("event_class") or details.get("taxonomy") or "").strip().upper()
    if explicit in EVENT_TAXONOMY:
        return explicit
    if ev == "commit" or src == "git":
        return "GIT"
    if ev in {"ingest_summary"} or src in {"ingest", "notion_export", "notion_export_html"}:
        return "INGEST"
    if ev == "doc":
        return "DOC"
    if ev == "task":
        return "TASK"
    if ev == "seal":
        return "SEAL"
    if ev == "verify":
        return "VERIFY"
    if ev == "backup":
        return "BACKUP"
    if ev == "restore":
        return "RESTORE"
    if ev == "security":
        return "SECURITY"
    if ev == "config":
        return "CONFIG"
    return "SYSTEM"


def compute_fingerprint(project: str, event_type: str, message: str) -> str:
    payload = f"{project}|{event_type}|{normalize_error_message(message)}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def decode_json_value(value: str, fallback: Any) -> Any:
    try:
        parsed = json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return fallback
    if isinstance(fallback, dict):
        return parsed if isinstance(parsed, dict) else fallback
    if isinstance(fallback, list):
        return parsed if isinstance(parsed, list) else fallback
    return parsed


def build_canonical_event_string(
    *,
    event_id: int,
    ts: str,
    event_type: str,
    project: str,
    severity: str,
    summary: str,
    details_obj: Dict[str, Any],
    evidence_obj: List[str],
    source: str,
) -> str:
    payload = {
        "id": int(event_id),
        "ts": ts,
        "type": event_type,
        "project": project,
        "severity": severity,
        "summary": summary,
        "details": details_obj,
        "evidence_paths": evidence_obj,
        "source": source,
    }
    return canonical_json(payload)


def compute_chain_hash(prev_hash: str, canonical_event: str) -> str:
    return hashlib.sha256(f"{prev_hash}|{canonical_event}".encode("utf-8")).hexdigest()


def chain_needs_seal(conn: sqlite3.Connection) -> bool:
    row = conn.execute(
        """
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN COALESCE(hash, '') = '' THEN 1 ELSE 0 END) AS missing_hashes,
          SUM(CASE WHEN id > 1 AND COALESCE(prev_hash, '') = '' THEN 1 ELSE 0 END) AS missing_prev
        FROM events
        """
    ).fetchone()
    total = int(row["total"] or 0)
    missing_hashes = int(row["missing_hashes"] or 0)
    missing_prev = int(row["missing_prev"] or 0)
    return total > 0 and (missing_hashes > 0 or missing_prev > 0)


def seal_event_chain(conn: sqlite3.Connection) -> Dict[str, Any]:
    rows = conn.execute(
        """
        SELECT id, ts, type, project, severity, summary, details_json, evidence_paths_json, source, prev_hash, hash
        FROM events
        ORDER BY id ASC
        """
    ).fetchall()

    previous_hash = ""
    updated = 0
    checked = 0
    for row in rows:
        checked += 1
        details_obj = decode_json_value(row["details_json"], {})
        evidence_obj = [str(item) for item in decode_json_value(row["evidence_paths_json"], [])]
        canonical = build_canonical_event_string(
            event_id=int(row["id"]),
            ts=str(row["ts"]),
            event_type=str(row["type"]),
            project=str(row["project"]),
            severity=str(row["severity"]),
            summary=str(row["summary"]),
            details_obj=details_obj,
            evidence_obj=evidence_obj,
            source=str(row["source"]),
        )
        expected_prev = previous_hash
        expected_hash = compute_chain_hash(expected_prev, canonical)
        current_prev = str(row["prev_hash"] or "")
        current_hash = str(row["hash"] or "")
        if current_prev != expected_prev or current_hash != expected_hash:
            conn.execute(
                "UPDATE events SET prev_hash = ?, hash = ? WHERE id = ?",
                (expected_prev, expected_hash, int(row["id"])),
            )
            updated += 1
        previous_hash = expected_hash

    if updated:
        conn.commit()
    return {"ok": True, "checked_events": checked, "updated_events": updated, "head_hash": previous_hash}


def ensure_chain_seeded(conn: sqlite3.Connection) -> None:
    if chain_needs_seal(conn):
        seal_event_chain(conn)


def verify_event_chain(conn: sqlite3.Connection) -> Dict[str, Any]:
    rows = conn.execute(
        """
        SELECT id, ts, type, project, severity, summary, details_json, evidence_paths_json, source, prev_hash, hash
        FROM events
        ORDER BY id ASC
        """
    ).fetchall()

    previous_hash = ""
    checked = 0
    for row in rows:
        checked += 1
        row_id = int(row["id"])
        current_prev = str(row["prev_hash"] or "")
        if current_prev != previous_hash:
            return {
                "ok": False,
                "checked_events": checked,
                "broken_at_id": row_id,
                "reason": "prev_hash_mismatch",
                "expected_prev_hash": previous_hash,
                "actual_prev_hash": current_prev,
            }

        details_obj = decode_json_value(row["details_json"], {})
        evidence_obj = [str(item) for item in decode_json_value(row["evidence_paths_json"], [])]
        canonical = build_canonical_event_string(
            event_id=row_id,
            ts=str(row["ts"]),
            event_type=str(row["type"]),
            project=str(row["project"]),
            severity=str(row["severity"]),
            summary=str(row["summary"]),
            details_obj=details_obj,
            evidence_obj=evidence_obj,
            source=str(row["source"]),
        )
        expected_hash = compute_chain_hash(previous_hash, canonical)
        current_hash = str(row["hash"] or "")
        if not current_hash:
            return {
                "ok": False,
                "checked_events": checked,
                "broken_at_id": row_id,
                "reason": "missing_hash",
                "expected_hash": expected_hash,
                "actual_hash": current_hash,
            }
        if current_hash != expected_hash:
            return {
                "ok": False,
                "checked_events": checked,
                "broken_at_id": row_id,
                "reason": "hash_mismatch",
                "expected_hash": expected_hash,
                "actual_hash": current_hash,
            }
        previous_hash = expected_hash

    return {"ok": True, "checked_events": checked, "head_hash": previous_hash}


def insert_event(
    conn: sqlite3.Connection,
    *,
    event_type: str,
    project: str,
    severity: str,
    summary: str,
    details: Optional[Dict[str, Any]] = None,
    evidence_paths: Optional[List[str]] = None,
    source: str = "manual",
    ts: Optional[str] = None,
) -> int:
    ensure_chain_seeded(conn)
    normalized_severity = normalize_severity(severity)
    details_obj = details.copy() if details else {}
    evidence_obj = list(evidence_paths) if evidence_paths else []
    details_obj["event_class"] = classify_event_taxonomy(event_type, source, details_obj)

    if normalized_severity in FAILURE_SEVERITIES and "fingerprint" not in details_obj:
        fp_msg = str(details_obj.get("error") or details_obj.get("message") or summary)
        details_obj["fingerprint"] = compute_fingerprint(project, event_type, fp_msg)

    details_json = canonical_json(details_obj)
    evidence_json = canonical_json(evidence_obj)
    ts_value = ts or now_utc_iso()
    previous_row = conn.execute(
        "SELECT id, hash FROM events ORDER BY id DESC LIMIT 1",
    ).fetchone()
    prev_hash = str(previous_row["hash"] or "") if previous_row else ""

    cursor = conn.execute(
        """
        INSERT INTO events (
          ts, type, project, severity, summary,
          details_json, evidence_paths_json, source, prev_hash, hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
        """,
        (
            ts_value,
            event_type,
            project,
            normalized_severity,
            summary,
            details_json,
            evidence_json,
            source,
            prev_hash,
        ),
    )
    event_id = int(cursor.lastrowid)
    canonical_event = build_canonical_event_string(
        event_id=event_id,
        ts=ts_value,
        event_type=event_type,
        project=project,
        severity=normalized_severity,
        summary=summary,
        details_obj=details_obj,
        evidence_obj=[str(item) for item in evidence_obj],
        source=source,
    )
    event_hash = compute_chain_hash(prev_hash, canonical_event)
    conn.execute("UPDATE events SET hash = ? WHERE id = ?", (event_hash, event_id))
    conn.commit()
    return event_id


def run_cmd(cmd: Sequence[str], cwd: Optional[Path] = None, timeout_sec: int = 20) -> Tuple[int, str, str]:
    proc = subprocess.run(
        list(cmd),
        cwd=str(cwd) if cwd else None,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        errors="replace",
        timeout=timeout_sec,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


@lru_cache(maxsize=1)
def resolve_cli_version() -> str:
    env_version = str(os.getenv("SWD_VAULT_CLI_VERSION", "")).strip()
    if env_version:
        return env_version[:64]
    try:
        proc = subprocess.run(
            ["git", "-C", str(ROOT_DIR), "rev-parse", "--short", "HEAD"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            errors="replace",
            timeout=3,
        )
        if proc.returncode == 0 and proc.stdout.strip():
            return proc.stdout.strip()[:64]
    except Exception:
        pass
    return "unknown"


@lru_cache(maxsize=1)
def resolve_host_fingerprint() -> str:
    node_version = ""
    try:
        proc = subprocess.run(
            ["node", "-v"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            errors="replace",
            timeout=3,
        )
        if proc.returncode == 0:
            node_version = proc.stdout.strip()
    except Exception:
        node_version = ""

    host_payload = {
        "os": platform.system(),
        "os_release": platform.release(),
        "machine": platform.machine(),
        "python": platform.python_version(),
        "node": node_version,
    }
    return hashlib.sha256(canonical_json(host_payload).encode("utf-8")).hexdigest()[:20]


def ingest_provenance(run_profile: Optional[str] = None) -> Dict[str, Any]:
    profile = str(run_profile or "manual").strip() or "manual"
    return {
        "run_profile": profile[:40],
        "cli_version": resolve_cli_version(),
        "host_fingerprint": resolve_host_fingerprint(),
    }


def validate_counter_contract(scanned: int, inserted: int, skipped: int, label: str) -> List[str]:
    errors: List[str] = []
    if scanned < 0 or inserted < 0 or skipped < 0:
        errors.append(f"{label}: negative counter detected")
    if scanned < inserted + skipped:
        errors.append(f"{label}: scanned < inserted + skipped ({scanned} < {inserted + skipped})")
    if scanned == 0 and inserted > 0:
        errors.append(f"{label}: scanned == 0 but inserted > 0 ({inserted})")
    return errors


def relative_posix(path: Path, base: Path) -> str:
    return path.relative_to(base).as_posix()


def matches_patterns(rel_path: str, includes: List[str], excludes: List[str]) -> bool:
    include_hit = True if not includes else any(fnmatch.fnmatch(rel_path, pattern) for pattern in includes)
    exclude_hit = any(fnmatch.fnmatch(rel_path, pattern) for pattern in excludes)
    return include_hit and not exclude_hit


def discover_repo_files(repo_path: Path) -> List[Path]:
    candidates: List[Path] = []
    readme = repo_path / "README.md"
    if readme.exists() and readme.is_file():
        candidates.append(readme)

    for folder in ("docs", "logs", "ops"):
        base = repo_path / folder
        if not base.exists() or not base.is_dir():
            continue
        for file_path in base.rglob("*"):
            if not file_path.is_file():
                continue
            suffix = file_path.suffix.lower()
            if suffix in {".md", ".log", ".txt", ".out"}:
                candidates.append(file_path)
    return sorted(set(candidates))


LOG_BUNDLE_GLOB_RULES: List[Tuple[str, str]] = [
    ("SWD-Execution-Log.md", "swd_execution_log"),
    ("Notion-Execution-Log.md", "notion_execution_log"),
    ("docs/DECISIONS.md", "decisions"),
    ("docs/SWD_WORK_ORDER_UPDATE_*.md", "swd_work_order_update"),
    ("docs/SWD_DAILY_BRIEF_*.md", "swd_daily_brief"),
    ("projects/*/SWD-Execution-Log.md", "swd_execution_log"),
    ("projects/*/Notion-Execution-Log.md", "notion_execution_log"),
]


def discover_log_bundle_files(root_path: Path) -> List[Tuple[Path, str]]:
    discovered: Dict[str, Tuple[Path, str]] = {}
    for pattern, source_type in LOG_BUNDLE_GLOB_RULES:
        for match in root_path.glob(pattern):
            if not match.exists() or not match.is_file():
                continue
            rel = relative_posix(match, root_path)
            discovered[rel] = (match, source_type)
    return [discovered[key] for key in sorted(discovered.keys())]


def canonicalize_log_bundle_text(text: str) -> str:
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    lines: List[str] = []
    volatile_line = re.compile(
        r"^\s*(?:export(?:ed)?(?:\s+(?:on|at))?|generated(?:\s+(?:on|at))?|snapshot(?:\s+(?:on|at))?)\s*[:|-].*$",
        re.IGNORECASE,
    )
    for line in normalized.split("\n"):
        trimmed = line.rstrip()
        if volatile_line.match(trimmed):
            continue
        lines.append(trimmed)
    joined = "\n".join(lines)
    joined = re.sub(r"\n{3,}", "\n\n", joined)
    joined = unicodedata.normalize("NFC", joined)
    return joined.strip()


def extract_log_record_timestamp(text: str, file_path: Path) -> str:
    date_patterns = [
        r"(?mi)^\s*-\s*Date:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})\b",
        r"(?mi)^\s*Date:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})\b",
        r"(?mi)\b([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:Z|[+-][0-9]{2}:[0-9]{2})?)\b",
        r"(?mi)\b([0-9]{4}-[0-9]{2}-[0-9]{2})\b",
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text)
        if not match:
            continue
        raw = match.group(1).strip()
        try:
            dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except ValueError:
            try:
                dt = datetime.strptime(raw, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except ValueError:
                continue
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)
        return dt.replace(tzinfo=None).strftime("%Y-%m-%d %H:%M:%S")

    fallback_dt = datetime.fromtimestamp(file_path.stat().st_mtime, tz=timezone.utc)
    return fallback_dt.replace(tzinfo=None).strftime("%Y-%m-%d %H:%M:%S")


def log_bundle_event_type(source_type: str, canonical_text: str) -> str:
    lowered = canonical_text[:2000].lower()
    if source_type == "decisions":
        return "decision"
    if source_type == "swd_work_order_update":
        if "decision" in lowered or "go/no-go" in lowered or "approved" in lowered:
            return "decision"
        return "task"
    if source_type == "swd_daily_brief":
        return "note"
    if source_type == "notion_execution_log":
        if "decision" in lowered or "rationale" in lowered:
            return "decision"
        return "note"
    if source_type == "swd_execution_log":
        return "ops_sweep"
    return "note"


def log_bundle_seen(conn: sqlite3.Connection, bundle_fingerprint: str, source: str = "log_bundle") -> bool:
    row = conn.execute(
        """
        SELECT 1
        FROM events
        WHERE source = ?
          AND type = 'ingest_summary'
          AND json_extract(details_json, '$.bundle_fingerprint') = ?
        LIMIT 1
        """,
        (source, bundle_fingerprint),
    ).fetchone()
    return bool(row)


def existing_log_bundle_fingerprints(conn: sqlite3.Connection) -> Tuple[Set[str], Set[str]]:
    record_fps: Set[str] = set()
    file_fps: Set[str] = set()
    rows = conn.execute(
        """
        SELECT
          json_extract(details_json, '$.record_fingerprint') AS record_fp,
          json_extract(details_json, '$.file_fingerprint') AS file_fp
        FROM events
        WHERE source = 'log_bundle'
        """
    ).fetchall()
    for row in rows:
        rec = str(row["record_fp"] or "").strip()
        fil = str(row["file_fp"] or "").strip()
        if rec:
            record_fps.add(rec)
        if fil:
            file_fps.add(fil)
    return record_fps, file_fps


def write_ndjson_records(path: Path, records: List[Dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for record in records:
            handle.write(canonical_json(record))
            handle.write("\n")


def extract_markdown_metadata(text: str, fallback_title: str) -> Tuple[str, List[str], List[str]]:
    heading_pattern = re.compile(r"^(#{1,6})\s+(.+)$", re.MULTILINE)
    headings = [match.group(2).strip() for match in heading_pattern.finditer(text)]
    title = headings[0] if headings else fallback_title

    tags = set()
    for tag in re.findall(r"#([a-zA-Z0-9_-]+)", text):
        tags.add(tag.lower())

    corpus = " ".join(headings + [fallback_title, text[:1200]]).lower()
    keyword_tags = [
        "sop",
        "runbook",
        "decision",
        "policy",
        "security",
        "release",
        "ops",
        "governance",
        "incident",
    ]
    for keyword in keyword_tags:
        if keyword in corpus:
            tags.add(keyword)

    lane_tags = ["now", "next", "later"]
    for lane in lane_tags:
        if re.search(rf"\b{lane}\b", corpus):
            tags.add(lane)

    return title[:240], headings[:80], sorted(tags)


def parse_since_cutoff(raw_since: Optional[str]) -> Optional[datetime]:
    if not raw_since or not str(raw_since).strip():
        return None
    raw = str(raw_since).strip().lower()
    now = datetime.now(timezone.utc)
    if re.fullmatch(r"\d+d", raw):
        return now - timedelta(days=int(raw[:-1]))
    if re.fullmatch(r"\d+h", raw):
        return now - timedelta(hours=int(raw[:-1]))
    if re.fullmatch(r"\d+m", raw):
        return now - timedelta(minutes=int(raw[:-1]))
    try:
        dt = datetime.fromisoformat(raw.replace("z", "+00:00"))
    except ValueError:
        raise ValueError(f"Invalid --since value: {raw_since}") from None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    return dt


def text_excerpt_with_redaction(text: str, max_chars: int, redact_emails: bool) -> str:
    snippet = text[:max_chars]
    redactions: List[Tuple[str, str]] = [
        (r"(?m)^\s*([A-Z][A-Z0-9_]{2,})\s*=\s*.+$", r"\1=<REDACTED>"),
        (r"(?i)\bbearer(?:\s+token)?\s+[A-Za-z0-9._-]{12,}", "Bearer <REDACTED>"),
        (r"\b(sk-[A-Za-z0-9]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,})\b", "<REDACTED>"),
        (
            r"(?i)\b(api[_-]?key|token|secret|password|passwd|private[_-]?key)\s*[:=]\s*[^\s,;]+",
            r"\1=<REDACTED>",
        ),
    ]
    if redact_emails:
        redactions.append((r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", "<REDACTED_EMAIL>"))
    for pattern, replacement in redactions:
        snippet = re.sub(pattern, replacement, snippet)
    return snippet


def parse_markdown_path_tags(file_path: Path, repo_root: Path) -> List[str]:
    rel = relative_posix(file_path, repo_root).lower()
    tags = set()
    if "decision" in rel or "adr" in rel:
        tags.add("decision")
    if "runbook" in rel:
        tags.add("runbook")
    if "sop" in rel:
        tags.add("sop")
    if "policy" in rel:
        tags.add("policy")
    if "ops" in rel:
        tags.add("ops")
    return sorted(tags)


def notion_markdown_event_type(file_path: Path, headings: List[str], text: str) -> str:
    name = file_path.name.lower()
    corpus = " ".join(headings[:4]).lower() + " " + text[:800].lower()
    if "decision" in name or "adr" in name:
        return "decision"
    if any(token in corpus for token in ["decision", "rationale", "approved by", "adr"]):
        return "decision"
    return "doc"


def notion_event_exists(
    conn: sqlite3.Connection,
    *,
    event_type: str,
    source_path: str,
    sha256_value: str,
    source: str = "notion_export",
) -> bool:
    row = conn.execute(
        """
        SELECT 1
        FROM events
        WHERE source = ?
          AND type = ?
          AND json_extract(details_json, '$.path') = ?
          AND json_extract(details_json, '$.sha256') = ?
        LIMIT 1
        """,
        (source, event_type, source_path, sha256_value),
    ).fetchone()
    return bool(row)


def notion_task_exists(
    conn: sqlite3.Connection, *, source_path: str, row_hash: str, source: str = "notion_export"
) -> bool:
    row = conn.execute(
        """
        SELECT 1
        FROM events
        WHERE source = ?
          AND type = 'task'
          AND json_extract(details_json, '$.path') = ?
          AND json_extract(details_json, '$.row_hash') = ?
        LIMIT 1
        """,
        (source, source_path, row_hash),
    ).fetchone()
    return bool(row)


def sha256_file(file_path: Path) -> str:
    digest = hashlib.sha256()
    with file_path.open("rb") as handle:
        while True:
            chunk = handle.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def notion_bundle_zip_seen(conn: sqlite3.Connection, zip_sha256: str, source: str = "notion_export") -> bool:
    row = conn.execute(
        """
        SELECT 1
        FROM events
        WHERE source = ?
          AND type = 'ingest_summary'
          AND json_extract(details_json, '$.zip_sha256') = ?
        LIMIT 1
        """,
        (source, zip_sha256),
    ).fetchone()
    return bool(row)


def normalize_notion_markdown_for_fingerprint(text: str) -> str:
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    lines: List[str] = []
    timestamp_pattern = re.compile(
        r"^\s*(?:export(?:ed)?(?:\s+(?:on|at))?|last edited(?:\s+time)?|created(?:\s+time)?|updated(?:\s+(?:at|time))?)\s*[:|-].*$",
        re.IGNORECASE,
    )
    for line in normalized.split("\n"):
        compact = line.rstrip()
        if timestamp_pattern.match(compact):
            continue
        lines.append(compact)
    return "\n".join(lines).strip()


def strip_html_visible_text(raw_html: str) -> str:
    # Remove non-visible blocks first.
    without_scripts = re.sub(r"(?is)<script\b[^>]*>.*?</script>", " ", raw_html)
    without_styles = re.sub(r"(?is)<style\b[^>]*>.*?</style>", " ", without_scripts)
    without_comments = re.sub(r"(?is)<!--.*?-->", " ", without_styles)
    # Preserve section boundaries for better excerpts/headings context.
    block_tags = r"(?:p|div|section|article|li|ul|ol|br|tr|td|th|table|h1|h2|h3|h4|h5|h6)"
    with_breaks = re.sub(rf"(?is)</?{block_tags}\b[^>]*>", "\n", without_comments)
    no_tags = re.sub(r"(?is)<[^>]+>", " ", with_breaks)
    decoded = html.unescape(no_tags)
    collapsed = re.sub(r"[ \t\f\v]+", " ", decoded)
    collapsed = re.sub(r"\n\s*\n+", "\n\n", collapsed)
    return collapsed.strip()


def extract_html_metadata(text: str, fallback_title: str) -> Tuple[str, List[str], List[str], str]:
    title_match = re.search(r"(?is)<title\b[^>]*>(.*?)</title>", text)
    title = strip_html_visible_text(title_match.group(1)) if title_match else ""

    heading_matches = re.findall(r"(?is)<h([1-3])\b[^>]*>(.*?)</h\1>", text)
    headings: List[str] = []
    for _, raw_heading in heading_matches:
        heading = strip_html_visible_text(raw_heading)
        if heading:
            headings.append(heading[:240])
        if len(headings) >= 80:
            break

    visible_text = strip_html_visible_text(text)
    if not title:
        title = headings[0] if headings else fallback_title

    _, _, inferred_tags = extract_markdown_metadata(visible_text, fallback_title=title)
    return title[:240], headings, inferred_tags, visible_text


def normalize_csv_row(row: Dict[str, str]) -> Dict[str, str]:
    normalized: Dict[str, str] = {}
    for key, value in row.items():
        if key is None:
            continue
        cleaned_key = str(key).strip()
        if not cleaned_key:
            continue
        normalized[cleaned_key] = str(value or "").strip()
    return normalized


def csv_row_primary_key(row: Dict[str, str], row_hash: str) -> str:
    candidates = [
        "id",
        "uuid",
        "url",
        "link",
        "name",
        "task",
        "title",
    ]
    lowered = {str(key).strip().lower(): str(value or "").strip() for key, value in row.items()}
    for candidate in candidates:
        value = lowered.get(candidate, "")
        if value:
            return value
    return row_hash


def resolve_notion_exports_root(config: Dict[str, Any], override_path: Optional[str]) -> Path:
    if override_path:
        return resolve_path(override_path)
    notion_cfg = config.get("notion", {})
    if not isinstance(notion_cfg, dict):
        notion_cfg = {}
    exports_path = notion_cfg.get("exportsPath", "")
    if not isinstance(exports_path, str) or not exports_path.strip():
        raise ValueError("Notion exports path not configured (set notion.exportsPath or pass --exports-path)")
    return resolve_path(exports_path.strip())


def discover_notion_bundles(exports_root: Path) -> List[Path]:
    if not exports_root.exists():
        return []
    if exports_root.is_file():
        return []
    bundles = [entry for entry in exports_root.iterdir() if entry.is_dir()]
    if bundles:
        return sorted(bundles)

    has_direct_files = any(
        child.is_file() and child.suffix.lower() in {".md", ".csv", ".html", ".htm"} for child in exports_root.iterdir()
    )
    return [exports_root] if has_direct_files else []


def resolve_notion_extract_root(
    config: Dict[str, Any], override_extract_root: Optional[str], override_exports_path: Optional[str]
) -> Path:
    if override_extract_root:
        return resolve_path(override_extract_root)
    return resolve_notion_exports_root(config, override_exports_path)


def _safe_extract_zip_to_dir(zip_path: Path, dest_dir: Path) -> int:
    count = 0
    with zipfile.ZipFile(zip_path, "r") as archive:
        for member in archive.infolist():
            member_name = member.filename.replace("\\", "/")
            if not member_name or member_name.startswith("/") or ".." in Path(member_name).parts:
                raise ValueError(f"Unsafe zip member path '{member.filename}' in {zip_path}")
            target = (dest_dir / member_name).resolve()
            if dest_dir.resolve() not in [target, *target.parents]:
                raise ValueError(f"Blocked zip extraction outside destination for member '{member.filename}'")
        archive.extractall(dest_dir)
        count = len(archive.infolist())
    return count


def extract_notion_zip_bundle(
    *,
    zip_path: Path,
    bundle_dir: Path,
    force: bool,
) -> Dict[str, Any]:
    if not zip_path.exists() or not zip_path.is_file():
        raise ValueError(f"Notion zip not found: {zip_path}")

    if bundle_dir.exists():
        if any(bundle_dir.iterdir()):
            if not force:
                raise ValueError(f"Bundle dir already exists and is not empty: {bundle_dir}. Use --force to replace it.")
            shutil.rmtree(bundle_dir)

    bundle_dir.mkdir(parents=True, exist_ok=True)
    extracted_entries = _safe_extract_zip_to_dir(zip_path, bundle_dir)

    nested_zips_extracted = 0
    nested_zip_paths: List[str] = []
    seen_nested: Set[str] = set()
    changed = True
    while changed:
        changed = False
        nested_candidates = sorted(bundle_dir.rglob("*.zip"))
        for nested_zip in nested_candidates:
            if not re.search(r"(?i)part-\d+\.zip$", nested_zip.name):
                continue
            nested_resolved = str(nested_zip.resolve())
            if nested_resolved in seen_nested:
                continue
            seen_nested.add(nested_resolved)
            _safe_extract_zip_to_dir(nested_zip, nested_zip.parent)
            nested_zips_extracted += 1
            nested_zip_paths.append(relative_posix(nested_zip, bundle_dir))
            changed = True

    extracted_file_count = sum(1 for path in bundle_dir.rglob("*") if path.is_file())
    return {
        "zip_path": str(zip_path),
        "bundle_dir": str(bundle_dir),
        "extracted_entries": extracted_entries,
        "nested_zips_extracted": nested_zips_extracted,
        "nested_zip_paths": nested_zip_paths,
        "extracted_file_count": extracted_file_count,
    }


def build_notion_bundle_report(
    bundles: List[Path], *, cutoff: Optional[datetime]
) -> Dict[str, Any]:
    by_folder: Dict[str, int] = {}
    newest_docs: List[Tuple[float, Path]] = []
    largest_docs: List[Tuple[int, Path]] = []
    md_total = 0
    csv_total = 0
    html_total = 0

    for bundle_path in bundles:
        for md_file in bundle_path.rglob("*.md"):
            if not file_after_cutoff(md_file, cutoff):
                continue
            md_total += 1
            rel = relative_posix(md_file, bundle_path)
            top_folder = rel.split("/", 1)[0] if "/" in rel else "."
            by_folder[top_folder] = by_folder.get(top_folder, 0) + 1
            stat = md_file.stat()
            newest_docs.append((stat.st_mtime, md_file))
            largest_docs.append((stat.st_size, md_file))
        for csv_file in bundle_path.rglob("*.csv"):
            if not file_after_cutoff(csv_file, cutoff):
                continue
            csv_total += 1
        for pattern in ("*.html", "*.htm"):
            for html_file in bundle_path.rglob(pattern):
                if not file_after_cutoff(html_file, cutoff):
                    continue
                html_total += 1

    newest_docs_sorted = sorted(newest_docs, key=lambda item: item[0], reverse=True)[:10]
    largest_docs_sorted = sorted(largest_docs, key=lambda item: item[0], reverse=True)[:10]

    return {
        "bundles": [bundle.name for bundle in bundles],
        "md_files": md_total,
        "csv_files": csv_total,
        "html_files": html_total,
        "counts_by_folder": dict(sorted(by_folder.items(), key=lambda kv: (-kv[1], kv[0]))),
        "recent_docs": [
            {
                "path": str(path.resolve()),
                "modified_at": datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
            }
            for ts, path in newest_docs_sorted
        ],
        "largest_docs": [{"path": str(path.resolve()), "size_bytes": size} for size, path in largest_docs_sorted],
    }


def file_after_cutoff(file_path: Path, cutoff: Optional[datetime]) -> bool:
    if cutoff is None:
        return True
    modified = datetime.fromtimestamp(file_path.stat().st_mtime, tz=timezone.utc)
    return modified >= cutoff


def parse_row_datetime(value: str) -> Optional[datetime]:
    raw = str(value or "").strip()
    if not raw:
        return None
    raw = raw.replace("Z", "+00:00")
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%m/%d/%Y"):
        try:
            dt = datetime.strptime(raw, fmt).replace(tzinfo=timezone.utc)
            return dt
        except ValueError:
            pass
    try:
        dt = datetime.fromisoformat(raw)
    except ValueError:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def csv_row_passes_since(row: Dict[str, str], cutoff: Optional[datetime]) -> bool:
    if cutoff is None:
        return True
    keys = ["last edited time", "last edited", "updated", "updated at", "modified", "date"]
    lowered = {str(k).strip().lower(): str(v) for k, v in row.items() if k is not None}
    for key in keys:
        if key not in lowered:
            continue
        parsed = parse_row_datetime(lowered[key])
        if parsed is None:
            continue
        return parsed >= cutoff
    return True


def csv_pick_value(row: Dict[str, str], candidates: List[str]) -> str:
    lowered = {str(k).strip().lower(): str(v).strip() for k, v in row.items() if k is not None}
    for candidate in candidates:
        value = lowered.get(candidate.lower(), "")
        if value:
            return value
    return ""


def doc_event_exists(conn: sqlite3.Connection, project: str, source_path: str, sha256: str) -> bool:
    row = conn.execute(
        """
        SELECT 1
        FROM events
        WHERE project = ?
          AND type = 'doc'
          AND json_extract(details_json, '$.path') = ?
          AND json_extract(details_json, '$.sha256') = ?
        LIMIT 1
        """,
        (project, source_path, sha256),
    ).fetchone()
    return bool(row)


def commit_event_exists(conn: sqlite3.Connection, project: str, commit_hash: str) -> bool:
    row = conn.execute(
        """
        SELECT 1
        FROM events
        WHERE project = ?
          AND type = 'commit'
          AND json_extract(details_json, '$.commit_hash') = ?
        LIMIT 1
        """,
        (project, commit_hash),
    ).fetchone()
    return bool(row)


def event_with_hash_exists(
    conn: sqlite3.Connection, project: str, event_type: str, source_path: str, sha256: str
) -> bool:
    row = conn.execute(
        """
        SELECT 1
        FROM events
        WHERE project = ?
          AND type = ?
          AND json_extract(details_json, '$.path') = ?
          AND json_extract(details_json, '$.sha256') = ?
        LIMIT 1
        """,
        (project, event_type, source_path, sha256),
    ).fetchone()
    return bool(row)


def parse_git_log_lines(raw: str) -> List[Dict[str, str]]:
    commits: List[Dict[str, str]] = []
    for line in raw.splitlines():
        if not line.strip():
            continue
        parts = line.split("\x1f")
        if len(parts) < 5:
            continue
        commits.append(
            {
                "hash": parts[0],
                "author_name": parts[1],
                "author_email": parts[2],
                "authored_at": parts[3],
                "subject": parts[4].strip(),
            }
        )
    return commits


def parse_numstat(raw: str) -> Tuple[List[str], int, int]:
    files: List[str] = []
    insertions = 0
    deletions = 0
    for line in raw.splitlines():
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        add_raw, del_raw, path_raw = parts[0], parts[1], parts[2]
        files.append(path_raw)
        if add_raw.isdigit():
            insertions += int(add_raw)
        if del_raw.isdigit():
            deletions += int(del_raw)
    return files, insertions, deletions


def risk_tags_for_files(files: List[str]) -> List[str]:
    text = " ".join(files).lower()
    tags: List[str] = []
    if any(token in text for token in ["licensing", "payments", "payment", "wps", "crypto", "auth"]):
        tags.append("high_risk_surface")
    if any(token.startswith("docs/") or "/docs/" in token for token in files):
        tags.append("docs_touch")
    return tags


def discover_allowlisted_files(repo_path: Path, includes: List[str], excludes: List[str]) -> List[Path]:
    default_includes = [
        "README.md",
        "docs/**",
        "ops/**",
        "logs/**",
        "vault/README.md",
        "DECISIONS.md",
        "docs/DECISIONS.md",
    ]
    include_patterns = sorted(set(default_includes + includes))
    default_excludes = ["node_modules/**", ".next/**", "dist/**", "build/**", ".git/**"]
    exclude_patterns = sorted(set(default_excludes + excludes))

    files: List[Path] = []
    for root, dirs, names in os.walk(repo_path):
        rel_root = Path(root).relative_to(repo_path).as_posix()
        if rel_root == ".":
            rel_root = ""

        pruned: List[str] = []
        for dname in dirs:
            rel_dir = f"{rel_root}/{dname}" if rel_root else dname
            rel_dir = rel_dir.strip("/")
            if matches_patterns(f"{rel_dir}/", include_patterns, exclude_patterns) or any(
                pattern.startswith(f"{rel_dir}/") for pattern in include_patterns
            ):
                pruned.append(dname)
        dirs[:] = pruned

        for name in names:
            rel_file = f"{rel_root}/{name}" if rel_root else name
            rel_file = rel_file.strip("/")
            if not matches_patterns(rel_file, include_patterns, exclude_patterns):
                continue
            files.append(Path(root) / name)

    return sorted(set(files))


def git_since_value(raw_since: Optional[str]) -> Optional[str]:
    if not raw_since:
        return None
    raw = raw_since.strip().lower()
    if re.fullmatch(r"\d+d", raw):
        return f"{int(raw[:-1])} days ago"
    if re.fullmatch(r"\d+h", raw):
        return f"{int(raw[:-1])} hours ago"
    if re.fullmatch(r"\d+m", raw):
        return f"{int(raw[:-1])} minutes ago"
    return raw_since


def cmd_init(args: argparse.Namespace) -> int:
    db_path = resolve_db_path(Path(args.config), args.db_path)
    schema_path = Path(args.schema).expanduser().resolve()
    if not schema_path.exists():
        raise ValueError(f"Schema file not found: {schema_path}")

    conn = connect(db_path)
    ensure_phase1_schema_compat(conn)
    sql = schema_path.read_text(encoding="utf-8")
    conn.executescript(sql)
    conn.execute("PRAGMA journal_mode=WAL;")
    chain_seeded = False
    if chain_needs_seal(conn):
        seal_event_chain(conn)
        chain_seeded = True
    conn.commit()
    conn.close()

    print(f"Vault initialized at {db_path}")
    if chain_seeded:
        print("Event hash chain seeded for existing rows")
    return 0


def cmd_append(args: argparse.Namespace) -> int:
    db_path = resolve_db_path(Path(args.config), args.db_path)
    details = parse_json_object(args.details, "details")
    evidence = parse_json_array(args.evidence, "evidence")

    conn = connect(db_path)
    event_id = insert_event(
        conn,
        event_type=args.type,
        project=args.project,
        severity=args.severity,
        summary=args.summary,
        details=details,
        evidence_paths=[str(item) for item in evidence],
        source=args.source,
    )
    conn.close()

    print(f"Appended event id={event_id}")
    return 0


def execute_captured_command(
    conn: sqlite3.Connection,
    *,
    project: str,
    command: List[str],
    cwd: Path,
    source: str,
    profile: Optional[str] = None,
    run_group_id: Optional[str] = None,
) -> Dict[str, Any]:
    artifacts_dir = ROOT_DIR / "vault" / "artifacts" / "runs"
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    run_id = f"{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}-{uuid.uuid4().hex[:8]}"
    log_path = (artifacts_dir / f"{run_id}.log").resolve()

    started_at = now_utc_iso()
    started_perf = time.perf_counter()
    tail = deque(maxlen=30)
    cmd_text = " ".join(shlex.quote(part) for part in command)

    with log_path.open("w", encoding="utf-8") as log_file:
        log_file.write(f"$ {cmd_text}\n")
        process = subprocess.Popen(
            command,
            cwd=str(cwd),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            errors="replace",
            bufsize=1,
        )
        assert process.stdout is not None
        for line in process.stdout:
            log_file.write(line)
            tail.append(line.rstrip("\n"))
        exit_code = process.wait()

    ended_at = now_utc_iso()
    duration_ms = int((time.perf_counter() - started_perf) * 1000)
    summary = f"Run succeeded ({exit_code}): {cmd_text}" if exit_code == 0 else f"Run failed ({exit_code}): {cmd_text}"

    run_details = {
        "run_id": run_id,
        "run_group_id": run_group_id,
        "profile": profile,
        "command": command,
        "command_text": cmd_text,
        "cwd": str(cwd),
        "start_ts": started_at,
        "end_ts": ended_at,
        "duration_ms": duration_ms,
        "exit_code": exit_code,
    }
    run_event_id = insert_event(
        conn,
        event_type="run",
        project=project,
        severity="info" if exit_code == 0 else "warn",
        summary=summary,
        details=run_details,
        evidence_paths=[str(log_path)],
        source=source,
        ts=ended_at,
    )

    error_event_id = None
    if exit_code != 0:
        excerpt = [line for line in tail if line.strip()][-30:]
        decisive = excerpt[-1] if excerpt else f"Command exited with code {exit_code}"
        error_details = {
            "run_id": run_id,
            "run_group_id": run_group_id,
            "run_event_id": run_event_id,
            "profile": profile,
            "command_text": cmd_text,
            "cwd": str(cwd),
            "exit_code": exit_code,
            "duration_ms": duration_ms,
            "error": decisive[:500],
            "failure_excerpt": excerpt,
        }
        error_event_id = insert_event(
            conn,
            event_type="error",
            project=project,
            severity="blocker",
            summary=f"Run failure: {decisive[:240]}",
            details=error_details,
            evidence_paths=[str(log_path)],
            source=source,
            ts=ended_at,
        )

    return {
        "run_id": run_id,
        "run_event_id": run_event_id,
        "error_event_id": error_event_id,
        "exit_code": int(exit_code),
        "duration_ms": duration_ms,
        "log_path": str(log_path),
        "command_text": cmd_text,
        "project": project,
        "cwd": str(cwd),
    }


def validate_profile_commands(repo_name: str, profile: str, commands_cfg: Any) -> List[str]:
    if not isinstance(commands_cfg, dict):
        raise ValueError(f"Repo '{repo_name}' is missing commands config")
    profile_cmds = commands_cfg.get(profile)
    if not isinstance(profile_cmds, list):
        raise ValueError(f"Repo '{repo_name}' is missing commands profile '{profile}'")
    cleaned = [str(cmd).strip() for cmd in profile_cmds if isinstance(cmd, str) and str(cmd).strip()]
    if not cleaned:
        raise ValueError(f"Repo '{repo_name}' profile '{profile}' has no executable commands")
    return cleaned


def cmd_run_single(args: argparse.Namespace, config: Dict[str, Any], conn: sqlite3.Connection) -> int:
    if not args.project:
        raise ValueError("Single run mode requires --project")
    command = list(args.command or [])
    if command and command[0] == "--":
        command = command[1:]
    if not command:
        raise ValueError("Missing command after '--' (example: swd-vault run --project swd-os -- npm test)")

    repo_cwd = repo_path_for_project(config, args.project)
    if args.cwd:
        cwd = resolve_path(args.cwd)
    elif repo_cwd:
        cwd = repo_cwd
    else:
        cwd = ROOT_DIR
    cwd.mkdir(parents=True, exist_ok=True)

    result = execute_captured_command(
        conn,
        project=args.project,
        command=command,
        cwd=cwd,
        source=args.source,
    )
    print(f"Run captured: run_id={result['run_id']} exit_code={result['exit_code']} log={result['log_path']}")
    return int(result["exit_code"])


def cmd_run_profile(args: argparse.Namespace, config: Dict[str, Any], conn: sqlite3.Connection) -> int:
    if not args.profile:
        raise ValueError("Profile mode requires --profile")
    if args.command and any(str(part).strip() for part in args.command):
        raise ValueError("Do not pass inline command when using profile mode")
    if not args.all and not args.project:
        raise ValueError("Profile mode requires --all or --project")

    repos = select_repos(config, args.project, args.all)
    run_group_id = f"runall-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}-{uuid.uuid4().hex[:8]}"
    started_perf = time.perf_counter()

    total_commands = 0
    total_passed = 0
    total_failed = 0
    stopped_on_failure = False
    repo_results: List[Dict[str, Any]] = []
    stop_reason = ""

    for repo in repos:
        repo_name = repo["name"]
        repo_path = resolve_path(repo["path"])
        if not repo_path.exists():
            raise ValueError(f"Repo path missing for '{repo_name}': {repo_path}")

        commands = validate_profile_commands(repo_name, args.profile, repo.get("commands"))
        repo_start = time.perf_counter()
        repo_passed = 0
        repo_failed = 0
        executed: List[Dict[str, Any]] = []

        for command_text in commands:
            cmd_parts = shlex.split(command_text)
            if not cmd_parts:
                raise ValueError(f"Repo '{repo_name}' profile '{args.profile}' has an empty command")

            result = execute_captured_command(
                conn,
                project=repo_name,
                command=cmd_parts,
                cwd=repo_path,
                source=args.source,
                profile=args.profile,
                run_group_id=run_group_id,
            )
            executed.append(result)
            total_commands += 1
            if result["exit_code"] == 0:
                repo_passed += 1
                total_passed += 1
            else:
                repo_failed += 1
                total_failed += 1
                if not args.continue_on_fail:
                    stopped_on_failure = True
                    stop_reason = (
                        f"stopped_on_failure repo={repo_name} command={result['command_text']} "
                        f"exit={result['exit_code']}"
                    )
                    break

        repo_duration_ms = int((time.perf_counter() - repo_start) * 1000)
        repo_results.append(
            {
                "repo": repo_name,
                "cwd": str(repo_path),
                "commands_total": len(commands),
                "commands_executed": len(executed),
                "passed": repo_passed,
                "failed": repo_failed,
                "duration_ms": repo_duration_ms,
                "executed": [
                    {
                        "run_id": item["run_id"],
                        "command_text": item["command_text"],
                        "exit_code": item["exit_code"],
                        "duration_ms": item["duration_ms"],
                        "log_path": item["log_path"],
                    }
                    for item in executed
                ],
            }
        )
        if stopped_on_failure:
            break

    duration_ms = int((time.perf_counter() - started_perf) * 1000)
    severity = "blocker" if total_failed > 0 else "info"
    summary = (
        f"Run profile '{args.profile}' complete: repos={len(repo_results)}/{len(repos)} "
        f"commands={total_commands} passed={total_passed} failed={total_failed}"
    )
    details = {
        "run_group_id": run_group_id,
        "profile": args.profile,
        "continue_on_fail": bool(args.continue_on_fail),
        "repos_total": len(repos),
        "repos_executed": len(repo_results),
        "commands_total": total_commands,
        "commands_passed": total_passed,
        "commands_failed": total_failed,
        "duration_ms": duration_ms,
        "stopped_on_failure": stopped_on_failure,
        "stop_reason": stop_reason,
        "repos": repo_results,
        "tag": "now" if total_failed > 0 else "next",
    }
    summary_event_id = insert_event(
        conn,
        event_type="run_summary",
        project=args.project or "swd-os",
        severity=severity,
        summary=summary,
        details=details,
        source=args.source,
    )
    print(summary)
    print(f"RunSummaryEventId={summary_event_id}")
    print(f"RunGroupId={run_group_id}")
    if stop_reason:
        print(stop_reason)
    return 1 if total_failed > 0 else 0


def cmd_run(args: argparse.Namespace) -> int:
    config = load_config(Path(args.config))
    conn = connect(resolve_db_path(Path(args.config), args.db_path))
    try:
        if args.profile:
            return cmd_run_profile(args, config, conn)
        if args.all:
            raise ValueError("Non-profile --all mode is not supported; pass --profile")
        return cmd_run_single(args, config, conn)
    finally:
        conn.close()


def cmd_sweep(args: argparse.Namespace) -> int:
    if args.mode != "system":
        raise ValueError("Only --mode system is supported in this phase")

    config = load_config(Path(args.config))
    repos = get_repo_entries(config)
    conn = connect(resolve_db_path(Path(args.config), args.db_path))

    warn_count = 0
    blocker_count = 0
    clean_count = 0
    repo_summaries: List[Dict[str, Any]] = []

    for repo in repos:
        repo_name = repo["name"]
        repo_path = resolve_path(repo["path"])

        if not repo_path.exists():
            blocker_count += 1
            summary = f"Sweep {repo_name}: path missing ({repo_path})"
            details = {
                "mode": args.mode,
                "repo_name": repo_name,
                "repo_path": str(repo_path),
                "error": "repo_path_missing",
            }
            insert_event(
                conn,
                event_type="ops_sweep",
                project=repo_name,
                severity="blocker",
                summary=summary,
                details=details,
                source=args.source,
            )
            repo_summaries.append({"project": repo_name, "severity": "blocker", "summary": summary})
            continue

        status_code, status_out, status_err = run_cmd(["git", "-C", str(repo_path), "status", "--porcelain"])
        branch_code, branch_out, _ = run_cmd(["git", "-C", str(repo_path), "rev-parse", "--abbrev-ref", "HEAD"])
        commit_code, commit_out, _ = run_cmd(["git", "-C", str(repo_path), "log", "-1", "--pretty=%H"])

        if status_code != 0:
            blocker_count += 1
            summary = f"Sweep {repo_name}: git status failed"
            details = {
                "mode": args.mode,
                "repo_name": repo_name,
                "repo_path": str(repo_path),
                "status_code": status_code,
                "status_error": status_err[:500],
                "branch": branch_out if branch_code == 0 else "",
                "last_commit": commit_out if commit_code == 0 else "",
                "error": "git_status_failed",
            }
            insert_event(
                conn,
                event_type="ops_sweep",
                project=repo_name,
                severity="blocker",
                summary=summary,
                details=details,
                source=args.source,
            )
            repo_summaries.append({"project": repo_name, "severity": "blocker", "summary": summary})
            continue

        dirty_files = [line.strip() for line in status_out.splitlines() if line.strip()]
        dirty_count = len(dirty_files)
        if dirty_count > 0:
            severity = "warn"
            warn_count += 1
            summary = f"Sweep {repo_name}: {dirty_count} dirty file(s)"
        else:
            severity = "info"
            clean_count += 1
            summary = f"Sweep {repo_name}: clean"

        details = {
            "mode": args.mode,
            "repo_name": repo_name,
            "repo_path": str(repo_path),
            "dirty_count": dirty_count,
            "dirty_files_sample": dirty_files[:50],
            "branch": branch_out if branch_code == 0 else "",
            "last_commit": commit_out if commit_code == 0 else "",
        }
        insert_event(
            conn,
            event_type="ops_sweep",
            project=repo_name,
            severity=severity,
            summary=summary,
            details=details,
            source=args.source,
        )
        repo_summaries.append({"project": repo_name, "severity": severity, "summary": summary})

    overall = "info"
    if blocker_count > 0:
        overall = "blocker"
    elif warn_count > 0:
        overall = "warn"

    summary_text = (
        f"System sweep complete: repos={len(repos)} clean={clean_count} warn={warn_count} blocker={blocker_count}"
    )
    summary_details = {
        "mode": args.mode,
        "repos_total": len(repos),
        "clean": clean_count,
        "warn": warn_count,
        "blocker": blocker_count,
        "repos": repo_summaries,
        "tag": "now" if blocker_count > 0 else "next" if warn_count > 0 else "later",
    }
    insert_event(
        conn,
        event_type="ops_sweep",
        project=args.project,
        severity=overall,
        summary=summary_text,
        details=summary_details,
        source=args.source,
    )
    conn.close()

    print(summary_text)
    return 0


def cmd_ingest_bootstrap(args: argparse.Namespace) -> int:
    config = load_config(Path(args.config))
    repos = select_repos(config, args.project, args.all)
    conn = connect(resolve_db_path(Path(args.config), args.db_path))

    ingested_docs = 0
    ingested_logs = 0
    skipped_existing = 0

    for repo in repos:
        repo_name = repo["name"]
        repo_path = resolve_path(repo["path"])
        includes = [str(p) for p in repo.get("include", []) if isinstance(p, str)]
        excludes = [str(p) for p in repo.get("exclude", []) if isinstance(p, str)]

        if not repo_path.exists():
            insert_event(
                conn,
                event_type="doc",
                project=repo_name,
                severity="warn",
                summary=f"Bootstrap ingest skipped missing repo path: {repo_path}",
                details={"repo_path": str(repo_path), "error": "repo_path_missing"},
                source="ingest",
            )
            continue

        for file_path in discover_allowlisted_files(repo_path, includes, excludes):
            if file_path.stat().st_size > int(args.max_bytes):
                continue

            rel = relative_posix(file_path, repo_path)
            text = file_path.read_text(encoding="utf-8", errors="replace")
            file_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
            evidence = [str(file_path.resolve())]
            abs_path = str(file_path.resolve())

            if file_path.suffix.lower() == ".md":
                summary, headings, tags = extract_markdown_metadata(text, fallback_title=file_path.name)
                details = {
                    "path": abs_path,
                    "relative_path": rel,
                    "sha256": file_hash,
                    "headings": headings,
                    "extracted_tags": tags,
                    "size_bytes": file_path.stat().st_size,
                }
                if doc_event_exists(conn, repo_name, abs_path, file_hash):
                    skipped_existing += 1
                    continue
                insert_event(
                    conn,
                    event_type="doc",
                    project=repo_name,
                    severity="info",
                    summary=summary,
                    details=details,
                    evidence_paths=evidence,
                    source="ingest",
                )
                ingested_docs += 1
                continue

            # Log-like files become run/error memory entries.
            has_failure = bool(re.search(r"(error|exception|failed?)", text, re.IGNORECASE))
            sev = "warn" if has_failure else "info"
            ev_type = "error" if has_failure else "run"
            summary = f"Ingested log: {rel}"
            details = {
                "path": abs_path,
                "relative_path": rel,
                "sha256": file_hash,
                "size_bytes": file_path.stat().st_size,
            }
            if has_failure:
                tail = [line.strip() for line in text.splitlines() if line.strip()][-30:]
                details["message"] = tail[-1] if tail else "log_contains_failure_terms"
                details["failure_excerpt"] = tail
            if event_with_hash_exists(conn, repo_name, ev_type, abs_path, file_hash):
                skipped_existing += 1
                continue
            insert_event(
                conn,
                event_type=ev_type,
                project=repo_name,
                severity=sev,
                summary=summary,
                details=details,
                evidence_paths=evidence,
                source="ingest",
            )
            ingested_logs += 1

    insert_event(
        conn,
        event_type="ops_sweep",
        project=args.project or "swd-os",
        severity="info",
        summary=f"Bootstrap ingest complete: repos={len(repos)} docs={ingested_docs} logs={ingested_logs}",
        details={
            "repos": len(repos),
            "docs": ingested_docs,
            "logs": ingested_logs,
            "skipped_existing": skipped_existing,
            "tag": "next",
        },
        source="ingest",
    )
    conn.close()

    print(
        "Bootstrap ingest complete: "
        f"repos={len(repos)} docs={ingested_docs} logs={ingested_logs} skipped={skipped_existing}"
    )
    return 0


def cmd_ingest_git(args: argparse.Namespace) -> int:
    config = load_config(Path(args.config))
    repos = select_repos(config, args.project, args.all)
    db_path = resolve_db_path(Path(args.config), args.db_path)
    conn = connect(db_path)

    total_inserted = 0
    total_skipped = 0
    total_scanned = 0
    since_arg = git_since_value(args.since)

    for repo in repos:
        repo_name = repo["name"]
        repo_path = resolve_path(repo["path"])
        if not repo_path.exists():
            insert_event(
                conn,
                event_type="commit",
                project=repo_name,
                severity="warn",
                summary=f"Git ingest skipped missing repo path: {repo_path}",
                details={"repo_path": str(repo_path), "error": "repo_path_missing"},
                source="git",
            )
            continue

        check_code, _, _ = run_cmd(["git", "-C", str(repo_path), "rev-parse", "--is-inside-work-tree"])
        if check_code != 0:
            insert_event(
                conn,
                event_type="commit",
                project=repo_name,
                severity="warn",
                summary=f"Git ingest skipped non-git repo: {repo_path}",
                details={"repo_path": str(repo_path), "error": "not_git_repo"},
                source="git",
            )
            continue

        branch_code, branch_out, _ = run_cmd(["git", "-C", str(repo_path), "rev-parse", "--abbrev-ref", "HEAD"])
        branch = branch_out.strip() if branch_code == 0 else ""

        log_cmd = [
            "git",
            "-C",
            str(repo_path),
            "log",
            "--date=iso-strict",
            "--pretty=format:%H%x1f%an%x1f%ae%x1f%ad%x1f%s",
        ]
        if since_arg:
            log_cmd.append(f"--since={since_arg}")
        if args.max_commits and int(args.max_commits) > 0:
            log_cmd.append(f"--max-count={int(args.max_commits)}")

        log_code, log_out, log_err = run_cmd(log_cmd, timeout_sec=60)
        if log_code != 0:
            insert_event(
                conn,
                event_type="commit",
                project=repo_name,
                severity="warn",
                summary=f"Git log failed for {repo_name}",
                details={"repo_path": str(repo_path), "error": log_err[:500]},
                source="git",
            )
            continue

        commits = parse_git_log_lines(log_out)
        total_scanned += len(commits)

        for commit in commits:
            commit_hash = commit["hash"]
            if commit_event_exists(conn, repo_name, commit_hash):
                total_skipped += 1
                continue

            numstat_code, numstat_out, _ = run_cmd(
                ["git", "-C", str(repo_path), "show", "--numstat", "--format=", commit_hash],
                timeout_sec=30,
            )
            if numstat_code != 0:
                numstat_out = ""
            files_changed, insertions, deletions = parse_numstat(numstat_out)
            risk_tags = risk_tags_for_files(files_changed)

            severity = "warn" if "high_risk_surface" in risk_tags else "info"
            details = {
                "commit_hash": commit_hash,
                "author": commit["author_name"],
                "author_email": commit["author_email"],
                "authored_at": normalize_ts(commit["authored_at"]),
                "subject": commit["subject"],
                "branch": branch,
                "files_changed": files_changed,
                "files_changed_count": len(files_changed),
                "insertions": insertions,
                "deletions": deletions,
                "risk_tags": risk_tags,
            }
            summary = commit["subject"] or f"Commit {commit_hash[:12]}"
            insert_event(
                conn,
                event_type="commit",
                project=repo_name,
                severity=severity,
                summary=summary[:280],
                details=details,
                source="git",
                ts=normalize_ts(commit["authored_at"]),
            )
            total_inserted += 1

    insert_event(
        conn,
        event_type="ops_sweep",
        project=args.project or "swd-os",
        severity="info",
        summary=(
            "Git ingest complete: "
            f"repos={len(repos)} scanned={total_scanned} inserted={total_inserted} skipped={total_skipped}"
        ),
        details={
            "repos": len(repos),
            "scanned_commits": total_scanned,
            "inserted_commits": total_inserted,
            "skipped_existing": total_skipped,
            "since": args.since,
            "tag": "next",
        },
        source="git",
    )
    conn.close()

    print(
        "Git ingest complete: "
        f"repos={len(repos)} scanned={total_scanned} inserted={total_inserted} skipped={total_skipped}"
    )
    return 0


def cmd_ingest_logs(args: argparse.Namespace) -> int:
    _ = load_config(Path(args.config))
    db_path = resolve_db_path(Path(args.config), args.db_path)
    conn = connect(db_path)
    started_perf = time.perf_counter()
    cutoff = parse_since_cutoff(args.since)
    provenance = ingest_provenance(run_profile=str(os.getenv("SWD_VAULT_RUN_PROFILE", "manual")))
    root_path = resolve_path(args.root)
    if not root_path.exists() or not root_path.is_dir():
        conn.close()
        raise ValueError(f"Invalid --root path: {root_path}")

    bundle_id = str(args.bundle).strip()
    if not bundle_id:
        conn.close()
        raise ValueError("--bundle is required")
    bundle_created_at = now_utc_iso()

    discovered = discover_log_bundle_files(root_path)
    records: List[Dict[str, Any]] = []
    skipped_large = 0
    source_type_counts: Dict[str, int] = {}

    for file_path, source_type in discovered:
        if not file_after_cutoff(file_path, cutoff):
            continue
        if file_path.stat().st_size > int(args.max_bytes):
            skipped_large += 1
            continue

        raw_text = file_path.read_text(encoding="utf-8", errors="replace")
        canonical_text = canonicalize_log_bundle_text(raw_text)
        source_rel = relative_posix(file_path, root_path)
        source_abs = str(file_path.resolve())
        content_sha256 = hashlib.sha256(canonical_text.encode("utf-8")).hexdigest()
        file_fingerprint = hashlib.sha256(f"{source_rel}|{content_sha256}".encode("utf-8")).hexdigest()
        record_kind = "entry"
        record_fingerprint = hashlib.sha256(
            f"{bundle_id}|{source_rel}|{record_kind}|{content_sha256}".encode("utf-8")
        ).hexdigest()
        title, headings, tags = extract_markdown_metadata(canonical_text, fallback_title=file_path.stem)
        record_ts = extract_log_record_timestamp(canonical_text, file_path)
        event_type = log_bundle_event_type(source_type, canonical_text)
        merged_tags = sorted(set(tags + [source_type]))
        body_excerpt = text_excerpt_with_redaction(canonical_text, int(args.excerpt_chars), args.redact_emails)

        records.append(
            {
                "bundle_id": bundle_id,
                "bundle_created_at": bundle_created_at,
                "source_path": source_rel,
                "source_abs_path": source_abs,
                "source_type": source_type,
                "record_kind": record_kind,
                "record_ts": record_ts,
                "title": title[:280],
                "body_excerpt": body_excerpt,
                "tags": merged_tags,
                "headings": headings[:40],
                "content_sha256": content_sha256,
                "file_fingerprint": file_fingerprint,
                "record_fingerprint": record_fingerprint,
                "event_type": event_type,
            }
        )
        source_type_counts[source_type] = source_type_counts.get(source_type, 0) + 1

    files_scanned = len(records)
    records_scanned = len(records)
    bundle_parts = sorted(f"{record['source_path']}|{record['content_sha256']}" for record in records)
    bundle_fingerprint = hashlib.sha256("||".join(bundle_parts).encode("utf-8")).hexdigest() if bundle_parts else ""

    report_payload = {
        "bundle_id": bundle_id,
        "root": str(root_path),
        "files_scanned": files_scanned,
        "records_scanned": records_scanned,
        "skipped_large": skipped_large,
        "source_types": source_type_counts,
        "bundle_fingerprint": bundle_fingerprint,
        "sample_records": [
            {
                "source_path": record["source_path"],
                "source_type": record["source_type"],
                "record_ts": record["record_ts"],
                "title": record["title"],
                "record_fingerprint": record["record_fingerprint"],
            }
            for record in records[:10]
        ],
    }
    if args.report:
        print(canonical_json(report_payload))
        conn.close()
        return 0

    if bundle_fingerprint and log_bundle_seen(conn, bundle_fingerprint, source="log_bundle"):
        conn.close()
        message = f"Log bundle duplicate detected: bundle={bundle_id} bundle_fingerprint={bundle_fingerprint}"
        if args.strict_duplicate:
            raise ValueError(message)
        print(message)
        return 0

    ndjson_path = (ROOT_DIR / "vault" / "artifacts" / "log-bundles" / f"{bundle_id}.ndjson").resolve()
    ndjson_records = [
        {
            "bundle_id": record["bundle_id"],
            "bundle_created_at": record["bundle_created_at"],
            "source_path": record["source_path"],
            "source_type": record["source_type"],
            "record_kind": record["record_kind"],
            "record_ts": record["record_ts"],
            "title": record["title"],
            "body_excerpt": record["body_excerpt"],
            "tags": record["tags"],
            "content_sha256": record["content_sha256"],
            "record_fingerprint": record["record_fingerprint"],
            "provenance": provenance,
        }
        for record in records
    ]
    write_ndjson_records(ndjson_path, ndjson_records)

    existing_record_fps, existing_file_fps = existing_log_bundle_fingerprints(conn)
    records_inserted = 0
    records_skipped = 0

    for record in records:
        if record["record_fingerprint"] in existing_record_fps or record["file_fingerprint"] in existing_file_fps:
            records_skipped += 1
            continue

        details = {
            "bundle_id": bundle_id,
            "bundle_created_at": bundle_created_at,
            "source_path": record["source_path"],
            "source_type": record["source_type"],
            "record_kind": record["record_kind"],
            "record_ts": record["record_ts"],
            "title": record["title"],
            "body_excerpt": record["body_excerpt"],
            "tags": record["tags"],
            "headings": record["headings"],
            "content_sha256": record["content_sha256"],
            "sha256": record["content_sha256"],
            "record_fingerprint": record["record_fingerprint"],
            "file_fingerprint": record["file_fingerprint"],
            **provenance,
        }
        insert_event(
            conn,
            event_type=record["event_type"],
            project=args.project,
            severity="info",
            summary=record["title"],
            details=details,
            evidence_paths=[record["source_abs_path"], str(ndjson_path)],
            source="log_bundle",
            ts=record["record_ts"],
        )
        records_inserted += 1
        existing_record_fps.add(record["record_fingerprint"])
        existing_file_fps.add(record["file_fingerprint"])

    counter_errors = validate_counter_contract(records_scanned, records_inserted, records_skipped, "log_bundle")
    if counter_errors:
        insert_event(
            conn,
            event_type="system",
            project=args.project,
            severity="warning",
            summary="Ingest counter contract warning (log_bundle)",
            details={
                "source": "log_bundle",
                "errors": counter_errors,
                "bundle_id": bundle_id,
                "bundle_fingerprint": bundle_fingerprint,
                "records_scanned": records_scanned,
                "records_inserted": records_inserted,
                "records_skipped": records_skipped,
                **provenance,
            },
            source="log_bundle",
        )

    duration_ms = int((time.perf_counter() - started_perf) * 1000)
    duplicate_ratio = (records_skipped / records_scanned) if records_scanned else 0.0
    summary = (
        f"Log bundle ingest complete: bundle={bundle_id} files_scanned={files_scanned} records_scanned={records_scanned} "
        f"records_inserted={records_inserted} records_skipped={records_skipped} "
        f"duplicate_ratio={duplicate_ratio:.4f}"
    )

    no_new_events = records_scanned > 0 and records_inserted == 0 and records_skipped == records_scanned
    if no_new_events:
        conn.close()
        print(f"{summary} (no new events; duplicates skipped)")
        return 0

    details = {
        "source": "log_bundle",
        "bundle_id": bundle_id,
        "bundle_created_at": bundle_created_at,
        "root": str(root_path),
        "files_scanned": files_scanned,
        "records_scanned": records_scanned,
        "records_inserted": records_inserted,
        "records_skipped": records_skipped,
        "duplicate_ratio": duplicate_ratio,
        "bundle_fingerprint": bundle_fingerprint,
        "source_type_counts": source_type_counts,
        "duration_ms": duration_ms,
        "skipped_large": skipped_large,
        "since": args.since,
        "ndjson_path": str(ndjson_path),
        "tag": "next",
        **provenance,
    }
    event_id = insert_event(
        conn,
        event_type="ingest_summary",
        project=args.project,
        severity="info",
        summary=summary,
        details=details,
        evidence_paths=[str(ndjson_path)],
        source="log_bundle",
    )
    conn.close()

    print(summary)
    print(f"IngestSummaryEventId={event_id}")
    return 0


def cmd_ingest_notion(args: argparse.Namespace) -> int:
    config = load_config(Path(args.config))
    db_path = resolve_db_path(Path(args.config), args.db_path)
    conn = connect(db_path)
    cutoff = parse_since_cutoff(args.since)
    started_perf = time.perf_counter()
    zip_manifest: Optional[Dict[str, Any]] = None
    zip_sha256: Optional[str] = None
    provenance = ingest_provenance(run_profile=str(os.getenv("SWD_VAULT_RUN_PROFILE", "manual")))

    if args.zip:
        if not args.bundle:
            conn.close()
            raise ValueError("--bundle is required when using --zip")
        extract_root = resolve_notion_extract_root(config, args.extract_root, args.exports_path)
        extract_root.mkdir(parents=True, exist_ok=True)
        zip_path = resolve_path(args.zip)
        zip_sha256 = sha256_file(zip_path)
        if notion_bundle_zip_seen(conn, zip_sha256, source="notion_export"):
            duplicate_summary = f"Notion ingest skipped: duplicate zip already ingested (zip_sha256={zip_sha256})"
            conn.close()
            if args.strict_duplicate:
                raise ValueError(duplicate_summary)
            print(duplicate_summary)
            return 0
        bundle_dir = (extract_root / args.bundle).resolve()
        zip_manifest = extract_notion_zip_bundle(zip_path=zip_path, bundle_dir=bundle_dir, force=bool(args.force))
        zip_manifest["zip_sha256"] = zip_sha256
        exports_root = extract_root
        bundles = [bundle_dir]
    else:
        exports_root = resolve_notion_exports_root(config, args.exports_path)
        if not exports_root.exists():
            summary = f"Notion ingest skipped: exports path missing ({exports_root})"
            insert_event(
                conn,
                event_type="ingest_summary",
                project=args.project,
                severity="warn",
                summary=summary,
                details={
                    "source": "notion_export",
                    "exports_path": str(exports_root),
                    "bundles": [],
                    **provenance,
                    "tag": "now",
                },
                source="notion_export",
            )
            conn.close()
            print(summary)
            return 0

        bundles = discover_notion_bundles(exports_root)
        if args.bundle:
            bundles = [bundle for bundle in bundles if bundle.name == args.bundle]
            if not bundles:
                conn.close()
                raise ValueError(f"Notion bundle not found: {args.bundle}")
        elif not args.all:
            # Safe default: ingest all detected bundles unless explicitly narrowed.
            pass

    if not bundles:
        summary = f"Notion ingest complete: no bundles found under {exports_root}"
        insert_event(
            conn,
            event_type="ingest_summary",
            project=args.project,
            severity="info",
            summary=summary,
            details={
                "source": "notion_export",
                "exports_path": str(exports_root),
                "bundles": [],
                "md_scanned": 0,
                "md_inserted": 0,
                "md_skipped": 0,
                "html_scanned": 0,
                "html_inserted": 0,
                "html_skipped": 0,
                "csv_scanned": 0,
                "csv_rows_scanned": 0,
                "csv_rows_inserted": 0,
                "csv_rows_skipped": 0,
                "include_csv": bool(args.include_csv),
                "include_html": bool(args.include_html),
                **provenance,
                "tag": "next",
            },
            source="notion_export",
        )
        conn.close()
        print(summary)
        return 0

    if args.report:
        report = build_notion_bundle_report(bundles, cutoff=cutoff)
        print(canonical_json(report))
        conn.close()
        return 0

    md_scanned = 0
    md_inserted = 0
    md_skipped = 0
    html_scanned = 0
    html_inserted = 0
    html_skipped = 0
    csv_scanned = 0
    csv_rows_scanned = 0
    csv_rows_inserted = 0
    csv_rows_skipped = 0
    selected_bundle_names = [bundle.name for bundle in bundles]
    existing_fingerprints = {
        str(row["fp"])
        for row in conn.execute(
            """
            SELECT json_extract(details_json, '$.fingerprint') AS fp
            FROM events
            WHERE source = 'notion_export'
              AND json_extract(details_json, '$.fingerprint') IS NOT NULL
            """
        ).fetchall()
        if row["fp"]
    }

    for bundle_path in bundles:
        bundle_name = bundle_path.name
        md_files = sorted(bundle_path.rglob("*.md"))
        for md_file in md_files:
            if not file_after_cutoff(md_file, cutoff):
                continue
            if md_file.stat().st_size > int(args.max_bytes):
                md_skipped += 1
                continue
            md_scanned += 1
            text = md_file.read_text(encoding="utf-8", errors="replace")
            abs_path = str(md_file.resolve())
            rel_path = relative_posix(md_file, bundle_path)
            normalized_text = normalize_notion_markdown_for_fingerprint(text)
            content_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
            fingerprint_source = f"{bundle_name}|{rel_path}|{normalized_text}"
            file_fingerprint = hashlib.sha256(fingerprint_source.encode("utf-8")).hexdigest()
            if file_fingerprint in existing_fingerprints:
                md_skipped += 1
                continue

            summary, headings, tags = extract_markdown_metadata(text, fallback_title=md_file.stem)
            path_tags = parse_markdown_path_tags(md_file, bundle_path)
            merged_tags = sorted(set(tags + path_tags))
            event_type = notion_markdown_event_type(md_file, headings, text)
            if notion_event_exists(
                conn,
                event_type=event_type,
                source_path=abs_path,
                sha256_value=content_hash,
                source="notion_export",
            ):
                md_skipped += 1
                continue

            details = {
                "path": abs_path,
                "relative_path": rel_path,
                "source_path_hash": hashlib.sha256(abs_path.encode("utf-8")).hexdigest(),
                "sha256": content_hash,
                "fingerprint": file_fingerprint,
                "headings": headings,
                "tags": merged_tags,
                "excerpt": text_excerpt_with_redaction(text, int(args.excerpt_chars), args.redact_emails),
                "export_bundle": bundle_name,
                "size_bytes": md_file.stat().st_size,
            }
            insert_event(
                conn,
                event_type=event_type,
                project=args.project,
                severity="info",
                summary=summary[:280],
                details=details,
                evidence_paths=[abs_path],
                source="notion_export",
            )
            md_inserted += 1
            existing_fingerprints.add(file_fingerprint)

        if args.include_html:
            html_files = sorted(set(bundle_path.rglob("*.html")) | set(bundle_path.rglob("*.htm")))
            for html_file in html_files:
                if not file_after_cutoff(html_file, cutoff):
                    continue
                if html_file.stat().st_size > int(args.max_bytes):
                    html_skipped += 1
                    continue
                html_scanned += 1

                raw_html = html_file.read_text(encoding="utf-8", errors="replace")
                abs_path = str(html_file.resolve())
                rel_html_path = relative_posix(html_file, bundle_path)
                content_hash = hashlib.sha256(raw_html.encode("utf-8")).hexdigest()
                title, headings, inferred_tags, visible_text = extract_html_metadata(raw_html, fallback_title=html_file.stem)
                normalized_visible = normalize_notion_markdown_for_fingerprint(visible_text)
                file_fingerprint_source = f"{bundle_name}|{rel_html_path}|{normalized_visible}"
                file_fingerprint = hashlib.sha256(file_fingerprint_source.encode("utf-8")).hexdigest()
                if file_fingerprint in existing_fingerprints:
                    html_skipped += 1
                    continue

                event_type = notion_markdown_event_type(html_file, headings, visible_text)
                if notion_event_exists(
                    conn,
                    event_type=event_type,
                    source_path=abs_path,
                    sha256_value=content_hash,
                    source="notion_export",
                ):
                    html_skipped += 1
                    continue

                path_tags = parse_markdown_path_tags(html_file, bundle_path)
                merged_tags = sorted(set(inferred_tags + path_tags + ["html_export"]))
                details = {
                    "path": abs_path,
                    "relative_path": rel_html_path,
                    "source_path_hash": hashlib.sha256(abs_path.encode("utf-8")).hexdigest(),
                    "sha256": content_hash,
                    "fingerprint": file_fingerprint,
                    "format": "html",
                    "headings": headings,
                    "tags": merged_tags,
                    "excerpt": text_excerpt_with_redaction(visible_text, int(args.excerpt_chars), args.redact_emails),
                    "export_bundle": bundle_name,
                    "size_bytes": html_file.stat().st_size,
                }
                insert_event(
                    conn,
                    event_type=event_type,
                    project=args.project,
                    severity="info",
                    summary=title[:280],
                    details=details,
                    evidence_paths=[abs_path],
                    source="notion_export",
                )
                html_inserted += 1
                existing_fingerprints.add(file_fingerprint)

        if args.include_csv:
            csv_files = sorted(bundle_path.rglob("*.csv"))
            for csv_file in csv_files:
                if not file_after_cutoff(csv_file, cutoff):
                    continue
                if csv_file.stat().st_size > int(args.max_bytes):
                    csv_rows_skipped += 1
                    continue
                csv_scanned += 1
                abs_csv_path = str(csv_file.resolve())
                rel_csv_path = relative_posix(csv_file, bundle_path)
                with csv_file.open("r", encoding="utf-8", errors="replace", newline="") as handle:
                    reader = csv.DictReader(handle)
                    for row_index, row in enumerate(reader, start=1):
                        normalized_row = normalize_csv_row(row)
                        if not normalized_row:
                            csv_rows_skipped += 1
                            continue
                        if not csv_row_passes_since(normalized_row, cutoff):
                            csv_rows_skipped += 1
                            continue
                        csv_rows_scanned += 1
                        row_json = canonical_json(normalized_row)
                        row_hash = hashlib.sha256(row_json.encode("utf-8")).hexdigest()
                        row_primary_key = csv_row_primary_key(normalized_row, row_hash)
                        row_fingerprint_source = f"{bundle_name}|{rel_csv_path}|{row_primary_key}|{row_json}"
                        row_fingerprint = hashlib.sha256(row_fingerprint_source.encode("utf-8")).hexdigest()
                        if row_fingerprint in existing_fingerprints:
                            csv_rows_skipped += 1
                            continue
                        if notion_task_exists(conn, source_path=abs_csv_path, row_hash=row_hash, source="notion_export"):
                            csv_rows_skipped += 1
                            continue

                        title = csv_pick_value(normalized_row, ["Name", "Task", "Title"]) or f"Task row {row_index}"
                        status = csv_pick_value(normalized_row, ["Status", "State"])
                        priority = csv_pick_value(normalized_row, ["Priority"])
                        owner = csv_pick_value(normalized_row, ["Owner", "Assignee", "Assigned To", "Person"])
                        due = csv_pick_value(normalized_row, ["Due", "Due Date", "Deadline"])
                        url = csv_pick_value(normalized_row, ["URL", "Link"])
                        labels_raw = csv_pick_value(normalized_row, ["Labels", "Tags"])
                        labels = [part.strip() for part in labels_raw.split(",") if part.strip()] if labels_raw else []

                        excerpt_source = " | ".join(
                            [f"{key}={value}" for key, value in normalized_row.items() if value]
                        )
                        details = {
                            "path": abs_csv_path,
                            "relative_path": rel_csv_path,
                            "source_path_hash": hashlib.sha256(abs_csv_path.encode("utf-8")).hexdigest(),
                            "row_hash": row_hash,
                            "row_primary_key": row_primary_key,
                            "fingerprint": row_fingerprint,
                            "row_index": row_index,
                            "status": status,
                            "priority": priority,
                            "owner": owner,
                            "due_date": due,
                            "labels": labels,
                            "url": url,
                            "excerpt": text_excerpt_with_redaction(
                                excerpt_source, int(args.excerpt_chars), args.redact_emails
                            ),
                            "export_bundle": bundle_name,
                        }
                        insert_event(
                            conn,
                            event_type="task",
                            project=args.project,
                            severity="info",
                            summary=title[:280],
                            details=details,
                            evidence_paths=[abs_csv_path],
                            source="notion_export",
                        )
                        csv_rows_inserted += 1
                        existing_fingerprints.add(row_fingerprint)

    duration_ms = int((time.perf_counter() - started_perf) * 1000)
    summary_prefix = (
        f"Notion zip ingested: {selected_bundle_names[0]}"
        if zip_manifest is not None and len(selected_bundle_names) == 1
        else "Notion ingest complete"
    )
    summary = (
        f"{summary_prefix}: "
        f"bundles={len(selected_bundle_names)} md_scanned={md_scanned} md_inserted={md_inserted} md_skipped={md_skipped} "
        f"html_scanned={html_scanned} html_inserted={html_inserted} html_skipped={html_skipped} "
        f"csv_scanned={csv_scanned} csv_rows_scanned={csv_rows_scanned} "
        f"csv_rows_inserted={csv_rows_inserted} csv_rows_skipped={csv_rows_skipped}"
    )

    counter_errors: List[str] = []
    counter_errors.extend(validate_counter_contract(md_scanned, md_inserted, md_skipped, "markdown"))
    counter_errors.extend(validate_counter_contract(html_scanned, html_inserted, html_skipped, "html"))
    counter_errors.extend(validate_counter_contract(csv_rows_scanned, csv_rows_inserted, csv_rows_skipped, "csv_rows"))
    if counter_errors:
        insert_event(
            conn,
            event_type="system",
            project=args.project,
            severity="warning",
            summary="Ingest counter contract warning (notion)",
            details={
                "source": "notion_export",
                "errors": counter_errors,
                "bundles": selected_bundle_names,
                "md_scanned": md_scanned,
                "md_inserted": md_inserted,
                "md_skipped": md_skipped,
                "html_scanned": html_scanned,
                "html_inserted": html_inserted,
                "html_skipped": html_skipped,
                "csv_rows_scanned": csv_rows_scanned,
                "csv_rows_inserted": csv_rows_inserted,
                "csv_rows_skipped": csv_rows_skipped,
                **provenance,
            },
            source="notion_export",
        )

    no_new_events = (
        md_inserted == 0
        and html_inserted == 0
        and csv_rows_inserted == 0
        and (md_scanned > 0 or html_scanned > 0 or csv_scanned > 0)
    )
    if no_new_events:
        conn.close()
        print(f"{summary} (no new events; duplicates skipped)")
        return 0

    details = {
        "source": "notion_export",
        "exports_path": str(exports_root),
        "bundles": selected_bundle_names,
        "md_scanned": md_scanned,
        "md_inserted": md_inserted,
        "md_skipped": md_skipped,
        "html_scanned": html_scanned,
        "html_inserted": html_inserted,
        "html_skipped": html_skipped,
        "csv_scanned": csv_scanned,
        "csv_rows_scanned": csv_rows_scanned,
        "csv_rows_inserted": csv_rows_inserted,
        "csv_rows_skipped": csv_rows_skipped,
        "include_csv": bool(args.include_csv),
        "include_html": bool(args.include_html),
        "since": args.since,
        "duration_ms": duration_ms,
        "zip_mode": bool(args.zip),
        **provenance,
        "duplicate_control": {
            "bundle_duplicate": False,
            "md_duplicates_skipped": md_skipped,
            "html_duplicates_skipped": html_skipped,
            "csv_row_duplicates_skipped": csv_rows_skipped,
        },
        "tag": "next",
    }
    evidence_paths = [str(bundle.resolve()) for bundle in bundles]
    if zip_manifest is not None:
        details.update(
            {
                "zip_path": zip_manifest["zip_path"],
                "bundle_dir": zip_manifest["bundle_dir"],
                "nested_zips_extracted": zip_manifest["nested_zips_extracted"],
                "nested_zip_paths": zip_manifest["nested_zip_paths"],
                "extracted_entries": zip_manifest["extracted_entries"],
                "extracted_file_count": zip_manifest["extracted_file_count"],
                "zip_sha256": zip_manifest["zip_sha256"],
            }
        )
        evidence_paths.append(str(Path(zip_manifest["zip_path"]).resolve()))

    event_id = insert_event(
        conn,
        event_type="ingest_summary",
        project=args.project,
        severity="info",
        summary=summary,
        details=details,
        evidence_paths=evidence_paths,
        source="notion_export",
    )
    conn.close()
    print(summary)
    print(f"IngestSummaryEventId={event_id}")
    if zip_manifest is not None:
        print("Next: ./swd-vault verify chain && ./swd-vault backup --encrypt --dest ~/swd-backups/vault --rotate")
    return 0


def build_contextpack(
    conn: sqlite3.Connection, *, project: Optional[str], since: str, max_items: int
) -> str:
    filters: List[str] = []
    params: List[Any] = []
    if project:
        filters.append("project = ?")
        params.append(project)

    mode, since_val = parse_since(since)
    if mode == "relative" and since_val:
        filters.append("datetime(ts) >= datetime('now', ?)")
        params.append(since_val)
    elif mode == "absolute" and since_val:
        filters.append("datetime(ts) >= datetime(?)")
        params.append(since_val)

    where = f"WHERE {' AND '.join(filters)}" if filters else ""
    non_info_where = (
        f"{where} {'AND' if where else 'WHERE'} severity IN "
        "('notice','warning','critical','fatal','warn','blocker')"
    )

    total = conn.execute(f"SELECT COUNT(*) AS c FROM events {where}", params).fetchone()["c"]
    sev_rows = conn.execute(
        f"SELECT severity, COUNT(*) AS c FROM events {where} GROUP BY severity ORDER BY c DESC",
        params,
    ).fetchall()
    type_rows = conn.execute(
        f"SELECT type, COUNT(*) AS c FROM events {where} GROUP BY type ORDER BY c DESC",
        params,
    ).fetchall()
    recurring_rows = conn.execute(
        f"""
        SELECT
          COALESCE(json_extract(details_json, '$.fingerprint'), '(none)') AS fingerprint,
          COUNT(*) AS count,
          MIN(ts) AS first_seen,
          MAX(ts) AS last_seen,
          MAX(summary) AS sample_summary
        FROM events
        {non_info_where}
        GROUP BY fingerprint
        ORDER BY count DESC
        LIMIT 10
        """,
        params,
    ).fetchall()
    commit_rows = conn.execute(
        f"""
        SELECT ts, project, summary, json_extract(details_json, '$.commit_hash') AS commit_hash
        FROM events
        {where} {'AND' if where else 'WHERE'} type = 'commit'
        ORDER BY datetime(ts) DESC, id DESC
        LIMIT 12
        """,
        params,
    ).fetchall()
    docs_rows = conn.execute(
        f"""
        SELECT
          ts,
          project,
          summary,
          COALESCE(json_extract(details_json, '$.relative_path'), json_extract(details_json, '$.path')) AS path
        FROM events
        {where} {'AND' if where else 'WHERE'} type = 'doc'
        ORDER BY datetime(ts) DESC, id DESC
        LIMIT 12
        """,
        params,
    ).fetchall()
    notion_rows = conn.execute(
        f"""
        SELECT
          ts,
          type,
          project,
          summary,
          COALESCE(json_extract(details_json, '$.export_bundle'), '-') AS export_bundle,
          COALESCE(json_extract(details_json, '$.relative_path'), json_extract(details_json, '$.path'), '-') AS path
        FROM events
        {where} {'AND' if where else 'WHERE'} source = 'notion_export' AND type IN ('doc', 'decision')
        ORDER BY datetime(ts) DESC, id DESC
        LIMIT 12
        """,
        params,
    ).fetchall()
    recent_rows = conn.execute(
        f"""
        SELECT ts, severity, type, project, summary
        FROM events
        {where}
        ORDER BY datetime(ts) DESC, id DESC
        LIMIT ?
        """,
        [*params, max_items],
    ).fetchall()

    lines: List[str] = []
    lines.append("# SWD Vault Context Pack")
    lines.append("")
    lines.append(f"- Generated: {now_utc_iso()}")
    lines.append(f"- Since: {since}")
    lines.append(f"- Project: {project or 'all'}")
    lines.append(f"- Total events: {total}")
    lines.append("")
    lines.append("## Severity")
    if sev_rows:
        for row in sev_rows:
            lines.append(f"- {row['severity']}: {row['c']}")
    else:
        lines.append("- none")
    lines.append("")
    lines.append("## Types")
    if type_rows:
        for row in type_rows:
            lines.append(f"- {row['type']}: {row['c']}")
    else:
        lines.append("- none")
    lines.append("")
    lines.append("## Recent Commits")
    if commit_rows:
        for row in commit_rows:
            commit_hash = row["commit_hash"] or ""
            short_hash = commit_hash[:12] if commit_hash else "no-hash"
            lines.append(f"- [{row['ts']}] {row['project']} {short_hash} {row['summary']}")
    else:
        lines.append("- none")
    lines.append("")
    lines.append("## Key Docs Updated")
    if docs_rows:
        for row in docs_rows:
            lines.append(f"- [{row['ts']}] {row['project']} {row['path'] or '-'} ({row['summary']})")
    else:
        lines.append("- none")
    lines.append("")
    lines.append("## Recent Notion Docs / Decisions")
    if notion_rows:
        for row in notion_rows:
            lines.append(
                f"- [{row['ts']}] {row['project']} {row['type']} ({row['export_bundle']}) "
                f"{row['path']} ({row['summary']})"
            )
    else:
        lines.append("- none")
    lines.append("")
    lines.append("## Top Recurring Failures")
    if recurring_rows:
        for row in recurring_rows:
            lines.append(
                f"- {row['fingerprint']}: count={row['count']}, first={row['first_seen']}, "
                f"last={row['last_seen']} ({row['sample_summary']})"
            )
    else:
        lines.append("- none")
    lines.append("")
    lines.append("## Recent Events")
    if recent_rows:
        for row in recent_rows:
            lines.append(
                f"- [{row['ts']}] {row['severity'].upper()} {row['type']} ({row['project']}) {row['summary']}"
            )
    else:
        lines.append("- none")
    return "\n".join(lines)


def cmd_contextpack(args: argparse.Namespace) -> int:
    db_path = resolve_db_path(Path(args.config), args.db_path)
    conn = connect(db_path)
    markdown = build_contextpack(conn, project=args.project, since=args.since, max_items=args.max)
    conn.close()
    print(markdown)
    return 0


def cmd_verify_chain(args: argparse.Namespace) -> int:
    db_path = resolve_db_path(Path(args.config), args.db_path)
    conn = connect(db_path)
    seal_result: Optional[Dict[str, Any]] = None
    if args.seal_missing:
        if chain_needs_seal(conn):
            seed = seal_event_chain(conn)
            seal_result = seed
            print(
                f"Chain seeded: events={seed['checked_events']} updated={seed['updated_events']} "
                f"head={seed['head_hash'] or '-'}"
            )
            insert_event(
                conn,
                event_type="seal",
                project=args.project,
                severity="notice" if seed["updated_events"] > 0 else "info",
                summary="Event chain seal operation completed",
                details={
                    "checked_events": seed["checked_events"],
                    "updated_events": seed["updated_events"],
                    "head_hash": seed["head_hash"],
                },
                source="system",
            )
    result = verify_event_chain(conn)
    verify_event_id = insert_event(
        conn,
        event_type="verify",
        project=args.project,
        severity="info" if result["ok"] else "critical",
        summary="Event chain verified" if result["ok"] else "Event chain verification failed",
        details={
            "ok": bool(result["ok"]),
            "checked_events": int(result.get("checked_events") or 0),
            "broken_at_id": result.get("broken_at_id"),
            "reason": result.get("reason"),
            "head_hash": result.get("head_hash"),
            "seal_invoked": bool(args.seal_missing),
            "seal_updated_events": int((seal_result or {}).get("updated_events") or 0),
        },
        source="system",
    )
    conn.close()

    if result["ok"]:
        print(f"Chain OK: events={result['checked_events']} head={result['head_hash'] or '-'}")
        print(f"VerifyEventId={verify_event_id}")
        return 0

    print(
        f"CHAIN_BROKEN at event id={result.get('broken_at_id')} reason={result.get('reason')} "
        f"checked={result.get('checked_events')}"
    )
    if result.get("expected_prev_hash") is not None:
        print(f"expected_prev_hash={result.get('expected_prev_hash')}")
        print(f"actual_prev_hash={result.get('actual_prev_hash')}")
    if result.get("expected_hash") is not None:
        print(f"expected_hash={result.get('expected_hash')}")
        print(f"actual_hash={result.get('actual_hash')}")
    print(f"VerifyEventId={verify_event_id}")
    return 1


def sqlite_backup_file(source_db: Path, dest_file: Path) -> None:
    dest_file.parent.mkdir(parents=True, exist_ok=True)
    if dest_file.exists():
        dest_file.unlink()
    src = sqlite3.connect(source_db)
    dst = sqlite3.connect(dest_file)
    try:
        src.execute("PRAGMA wal_checkpoint(FULL)")
        src.backup(dst)
        dst.commit()
    finally:
        dst.close()
        src.close()


def encrypt_with_gpg(input_file: Path, output_file: Path, passphrase: str) -> None:
    if shutil.which("gpg") is None:
        raise ValueError("gpg binary is required for --encrypt but was not found")
    cmd = [
        "gpg",
        "--batch",
        "--yes",
        "--pinentry-mode",
        "loopback",
        "--passphrase",
        passphrase,
        "--symmetric",
        "--cipher-algo",
        "AES256",
        "--output",
        str(output_file),
        str(input_file),
    ]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, errors="replace")
    if proc.returncode != 0:
        raise ValueError(f"gpg encryption failed: {proc.stderr.strip() or proc.stdout.strip() or 'unknown error'}")


def decrypt_with_gpg(input_file: Path, output_file: Path, passphrase: str) -> None:
    if shutil.which("gpg") is None:
        raise ValueError("gpg binary is required for encrypted restore but was not found")
    cmd = [
        "gpg",
        "--batch",
        "--yes",
        "--pinentry-mode",
        "loopback",
        "--passphrase",
        passphrase,
        "--decrypt",
        "--output",
        str(output_file),
        str(input_file),
    ]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, errors="replace")
    if proc.returncode != 0:
        raise ValueError(f"gpg decrypt failed: {proc.stderr.strip() or proc.stdout.strip() or 'unknown error'}")


def parse_backup_stamp(file_path: Path) -> Optional[datetime]:
    match = re.fullmatch(r"vault-(\d{8}T\d{6}Z)\.sqlite(?:\.gpg)?", file_path.name)
    if not match:
        return None
    try:
        return datetime.strptime(match.group(1), "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def list_snapshot_backups(dest_dir: Path) -> List[Dict[str, Any]]:
    entries: List[Dict[str, Any]] = []
    for item in dest_dir.iterdir():
        if not item.is_file():
            continue
        stamp = parse_backup_stamp(item)
        if not stamp:
            continue
        entries.append({"path": item, "stamp": stamp, "name": item.name})
    entries.sort(key=lambda entry: (entry["stamp"], entry["name"]), reverse=True)
    return entries


def rotate_snapshot_backups(dest_dir: Path, keep_daily: int, keep_weekly: int, keep_monthly: int) -> Dict[str, Any]:
    backups = list_snapshot_backups(dest_dir)
    keep_paths: Set[Path] = set()

    daily_keys: set[str] = set()
    for entry in backups:
        if len(daily_keys) >= keep_daily:
            break
        key = entry["stamp"].strftime("%Y-%m-%d")
        if key in daily_keys:
            continue
        daily_keys.add(key)
        keep_paths.add(entry["path"])

    weekly_keys: set[str] = set()
    for entry in backups:
        if entry["path"] in keep_paths:
            continue
        if len(weekly_keys) >= keep_weekly:
            break
        iso_year, iso_week, _ = entry["stamp"].isocalendar()
        key = f"{iso_year}-W{iso_week:02d}"
        if key in weekly_keys:
            continue
        weekly_keys.add(key)
        keep_paths.add(entry["path"])

    monthly_keys: set[str] = set()
    for entry in backups:
        if entry["path"] in keep_paths:
            continue
        if len(monthly_keys) >= keep_monthly:
            break
        key = entry["stamp"].strftime("%Y-%m")
        if key in monthly_keys:
            continue
        monthly_keys.add(key)
        keep_paths.add(entry["path"])

    removed_files: List[str] = []
    for entry in backups:
        if entry["path"] in keep_paths:
            continue
        entry["path"].unlink(missing_ok=True)
        removed_files.append(str(entry["path"]))

    kept_files = [str(entry["path"]) for entry in backups if entry["path"] in keep_paths]
    return {
        "scanned": len(backups),
        "kept": len(kept_files),
        "removed": len(removed_files),
        "kept_files": kept_files[:50],
        "removed_files": removed_files[:200],
        "policy": {"daily": keep_daily, "weekly": keep_weekly, "monthly": keep_monthly},
    }


def cmd_backup(args: argparse.Namespace) -> int:
    db_path = resolve_db_path(Path(args.config), args.db_path)
    if not db_path.exists():
        raise ValueError(f"Vault DB not found: {db_path}")

    dest_dir = resolve_path(args.dest)
    dest_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    plain_backup = dest_dir / f"vault-{stamp}.sqlite"
    sqlite_backup_file(db_path, plain_backup)

    final_path = plain_backup
    encryption = "none"
    encrypted = False
    if args.encrypt:
        passphrase = os.environ.get(args.passphrase_env, "")
        if not passphrase:
            raise ValueError(
                f"--encrypt requires env var {args.passphrase_env} to be set with the backup passphrase"
            )
        encrypted_path = dest_dir / f"{plain_backup.name}.gpg"
        encrypt_with_gpg(plain_backup, encrypted_path, passphrase)
        plain_backup.unlink(missing_ok=True)
        final_path = encrypted_path
        encryption = "gpg-aes256"
        encrypted = True

    rotation_result = None
    if args.rotate:
        rotation_result = rotate_snapshot_backups(
            dest_dir=dest_dir,
            keep_daily=int(args.keep_daily),
            keep_weekly=int(args.keep_weekly),
            keep_monthly=int(args.keep_monthly),
        )

    backup_size = final_path.stat().st_size if final_path.exists() else 0
    conn = connect(db_path)
    event_id = insert_event(
        conn,
        event_type="backup",
        project=args.project,
        severity="info",
        summary=f"Vault backup created ({'encrypted' if encrypted else 'plain'})",
        details={
            "path": str(final_path),
            "dest_dir": str(dest_dir),
            "encrypted": encrypted,
            "encryption": encryption,
            "size_bytes": backup_size,
            "created_at": now_utc_iso(),
            "restore_hint": (
                f"gpg --decrypt {final_path} > vault.sqlite"
                if encrypted
                else f"sqlite3 vault.sqlite '.restore {final_path}'"
            ),
            "rotation": rotation_result or {},
        },
        evidence_paths=[str(final_path)],
        source="system",
    )
    conn.close()

    print(f"Backup created: {final_path}")
    print(f"Encrypted={str(encrypted).lower()} size_bytes={backup_size}")
    if rotation_result:
        print(
            "Rotation applied: "
            f"scanned={rotation_result['scanned']} kept={rotation_result['kept']} removed={rotation_result['removed']}"
        )
    print(f"BackupEventId={event_id}")
    return 0


def cmd_restore(args: argparse.Namespace) -> int:
    db_path = resolve_db_path(Path(args.config), args.db_path)
    source_path = resolve_path(args.from_path)
    if not source_path.exists() or not source_path.is_file():
        raise ValueError(f"Backup file not found: {source_path}")

    if not args.dry_run and not args.to:
        raise ValueError("Restore requires --to target path unless --dry-run is set")

    target_path: Optional[Path] = resolve_path(args.to) if args.to else None
    if target_path:
        if target_path.exists() and not args.force:
            raise ValueError(f"Restore target already exists: {target_path} (pass --force to overwrite)")
        if target_path.resolve() == db_path.resolve() and not args.force:
            raise ValueError("Refusing to overwrite live DB without --force")
        target_path.parent.mkdir(parents=True, exist_ok=True)

    is_encrypted = source_path.suffix.lower() == ".gpg"
    passphrase = ""
    if is_encrypted:
        passphrase = os.environ.get(args.passphrase_env, "")
        if not passphrase:
            raise ValueError(
                f"Encrypted restore requires env var {args.passphrase_env} to be set with backup passphrase"
            )

    with tempfile.TemporaryDirectory(prefix="vault-restore-") as tmp_dir_raw:
        tmp_dir = Path(tmp_dir_raw)
        candidate_db = tmp_dir / "candidate.sqlite"
        if is_encrypted:
            decrypt_with_gpg(source_path, candidate_db, passphrase)
        else:
            shutil.copy2(source_path, candidate_db)

        verify_conn = connect(candidate_db)
        verify_result = verify_event_chain(verify_conn)
        verify_conn.close()
        if not verify_result["ok"]:
            print(
                f"Restore verify failed: id={verify_result.get('broken_at_id')} "
                f"reason={verify_result.get('reason')}"
            )
            return 1

        restored_to = ""
        if not args.dry_run and target_path:
            if target_path.exists() and args.force:
                target_path.unlink()
            shutil.copy2(candidate_db, target_path)
            restored_to = str(target_path)

    conn = connect(db_path)
    event_id = insert_event(
        conn,
        event_type="restore",
        project=args.project,
        severity="info",
        summary="Vault restore drill complete" if args.dry_run else "Vault restore complete",
        details={
            "from_path": str(source_path),
            "dry_run": bool(args.dry_run),
            "to_path": restored_to,
            "verified_events": verify_result.get("checked_events", 0),
            "head_hash": verify_result.get("head_hash", ""),
            "encrypted_input": is_encrypted,
            "tag": "next",
        },
        evidence_paths=[str(source_path)],
        source="system",
    )
    conn.close()

    if args.dry_run:
        print(
            f"Restore dry-run OK: source={source_path} verified_events={verify_result.get('checked_events')} "
            f"head={verify_result.get('head_hash')}"
        )
    else:
        print(
            f"Restore OK: source={source_path} to={restored_to} "
            f"verified_events={verify_result.get('checked_events')} head={verify_result.get('head_hash')}"
        )
    print(f"RestoreEventId={event_id}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="swd-vault", description="SWD Vault CLI")
    parser.add_argument("--config", default=str(CONFIG_PATH), help="Path to vault config JSON")
    parser.add_argument("--db-path", help="Override DB path from config")

    subparsers = parser.add_subparsers(dest="command", required=True)

    init_parser = subparsers.add_parser("init", help="Initialize vault DB and schema")
    init_parser.add_argument("--schema", default=str(SCHEMA_PATH), help="Path to SQL schema file")
    init_parser.set_defaults(func=cmd_init)

    append_parser = subparsers.add_parser("append", help="Append one event")
    append_parser.add_argument("--type", required=True)
    append_parser.add_argument("--project", required=True)
    append_parser.add_argument("--severity", default="info", choices=SEVERITY_CHOICES)
    append_parser.add_argument("--summary", required=True)
    append_parser.add_argument("--details", help="JSON object string")
    append_parser.add_argument("--evidence", help="JSON array string")
    append_parser.add_argument("--source", default="manual")
    append_parser.set_defaults(func=cmd_append)

    run_parser = subparsers.add_parser("run", help="Run command and capture logs/evidence")
    run_parser.add_argument("--project", help="Project name (required for single-run mode)")
    run_parser.add_argument("--all", action="store_true", help="Run configured profile commands across all repos")
    run_parser.add_argument("--profile", help="Profile name from repo commands config (e.g. fast)")
    run_parser.add_argument(
        "--continue-on-fail",
        action="store_true",
        help="Continue executing remaining commands/repos after a failure",
    )
    run_parser.add_argument("--cwd", help="Optional run working directory")
    run_parser.add_argument("--source", default="system")
    run_parser.add_argument("command", nargs=argparse.REMAINDER, help="Command after --")
    run_parser.set_defaults(func=cmd_run)

    sweep_parser = subparsers.add_parser("sweep", help="Run system sweep across configured repos")
    sweep_parser.add_argument("--mode", default="system", choices=["system"])
    sweep_parser.add_argument("--project", default="swd-os")
    sweep_parser.add_argument("--source", default="system")
    sweep_parser.set_defaults(func=cmd_sweep)

    ingest_parser = subparsers.add_parser("ingest", help="Ingest repository docs/logs")
    ingest_sub = ingest_parser.add_subparsers(dest="ingest_command", required=True)

    ingest_bootstrap = ingest_sub.add_parser("bootstrap", help="Bootstrap ingest from configured repos")
    ingest_bootstrap.add_argument("--project", help="Ingest only one configured project")
    ingest_bootstrap.add_argument("--all", action="store_true", help="Ingest all configured repos")
    ingest_bootstrap.add_argument("--max-bytes", type=int, default=1_000_000)
    ingest_bootstrap.set_defaults(func=cmd_ingest_bootstrap)

    ingest_git = ingest_sub.add_parser("git", help="Backfill git commit history")
    ingest_git.add_argument("--project", help="Ingest only one configured project")
    ingest_git.add_argument("--all", action="store_true", help="Ingest all configured repos")
    ingest_git.add_argument("--since", default="30d", help="Git since window (e.g. 30d, 2026-01-01)")
    ingest_git.add_argument("--max-commits", type=int, default=1000)
    ingest_git.set_defaults(func=cmd_ingest_git)

    ingest_logs = ingest_sub.add_parser("logs", help="Ingest SWD governance log bundle artifacts")
    ingest_logs.add_argument("--bundle", required=True, help="Bundle id (e.g. swd-log-bundle-2026-02-20)")
    ingest_logs.add_argument("--root", default=str(ROOT_DIR), help="Workspace root to scan for bundle artifacts")
    ingest_logs.add_argument("--project", default="swd-os", help="Project label for ingested events")
    ingest_logs.add_argument("--since", default="", help="Optional since filter (30d, 2026-01-01)")
    ingest_logs.add_argument("--report", action="store_true", help="Report-only mode (no ingest writes)")
    ingest_logs.add_argument(
        "--strict-duplicate",
        action="store_true",
        help="Exit non-zero if bundle fingerprint already exists",
    )
    ingest_logs.add_argument("--max-bytes", type=int, default=2_000_000, help="Max file size to ingest")
    ingest_logs.add_argument(
        "--excerpt-chars",
        type=int,
        default=500,
        help="Max redacted excerpt characters stored in details_json.body_excerpt",
    )
    ingest_logs.add_argument("--redact-emails", action="store_true", help="Redact email addresses in excerpts")
    ingest_logs.set_defaults(func=cmd_ingest_logs)

    ingest_notion = ingest_sub.add_parser("notion", help="Ingest Notion markdown/csv exports")
    ingest_notion.add_argument("--all", action="store_true", help="Ingest all export bundles under exportsPath")
    ingest_notion.add_argument("--bundle", help="Ingest one export bundle by folder name")
    ingest_notion.add_argument("--since", default="", help="Optional since filter (30d, 2026-01-01)")
    ingest_notion.add_argument("--project", default="swd-os", help="Project label for ingested events")
    ingest_notion.add_argument("--exports-path", help="Override notion.exportsPath from config")
    ingest_notion.add_argument("--zip", help="Import from one Notion export zip snapshot")
    ingest_notion.add_argument("--extract-root", help="Extraction root override for --zip mode")
    ingest_notion.add_argument("--force", action="store_true", help="Replace non-empty target bundle dir in --zip mode")
    ingest_notion.add_argument(
        "--strict-duplicate",
        action="store_true",
        help="Exit non-zero if a duplicate bundle zip is detected",
    )
    ingest_notion.add_argument("--report", action="store_true", help="Report bundle stats only (no ingest writes)")
    ingest_notion.add_argument(
        "--include-csv",
        action="store_true",
        help="Also ingest CSV rows as task events (default is markdown-only)",
    )
    ingest_notion.add_argument(
        "--include-html",
        action="store_true",
        help="Also ingest HTML/HTM pages as doc/decision events",
    )
    ingest_notion.add_argument("--max-bytes", type=int, default=2_000_000, help="Max file size to ingest")
    ingest_notion.add_argument(
        "--excerpt-chars",
        type=int,
        default=500,
        help="Max redacted excerpt characters stored in details_json.excerpt",
    )
    ingest_notion.add_argument("--redact-emails", action="store_true", help="Redact email addresses in excerpts")
    ingest_notion.set_defaults(func=cmd_ingest_notion)

    context_parser = subparsers.add_parser("contextpack", help="Generate markdown digest")
    context_parser.add_argument("--project")
    context_parser.add_argument("--since", default="7d")
    context_parser.add_argument("--max", type=int, default=50, dest="max")
    context_parser.set_defaults(func=cmd_contextpack)

    verify_parser = subparsers.add_parser("verify", help="Verify vault integrity checks")
    verify_sub = verify_parser.add_subparsers(dest="verify_command", required=True)
    verify_chain = verify_sub.add_parser("chain", help="Verify append-only hash chain integrity")
    verify_chain.add_argument("--project", default="swd-os", help="Project label for verify/seal audit events")
    verify_chain.add_argument(
        "--seal-missing",
        action="store_true",
        help="Seed missing chain hashes before verification (one-time migration helper)",
    )
    verify_chain.set_defaults(func=cmd_verify_chain)

    backup_parser = subparsers.add_parser("backup", help="Create vault database snapshot backup")
    backup_parser.add_argument("--dest", default="~/swd-backups/vault", help="Backup destination directory")
    backup_parser.add_argument("--encrypt", action="store_true", help="Encrypt backup with gpg symmetric AES-256")
    backup_parser.add_argument("--rotate", action="store_true", help="Apply retention rotation after backup")
    backup_parser.add_argument("--keep-daily", type=int, default=7, help="Daily snapshots to keep during rotation")
    backup_parser.add_argument("--keep-weekly", type=int, default=4, help="Weekly snapshots to keep during rotation")
    backup_parser.add_argument("--keep-monthly", type=int, default=6, help="Monthly snapshots to keep during rotation")
    backup_parser.add_argument(
        "--passphrase-env",
        default="VAULT_BACKUP_PASSPHRASE",
        help="Env var containing backup encryption passphrase",
    )
    backup_parser.add_argument("--project", default="swd-os", help="Project label for backup event")
    backup_parser.set_defaults(func=cmd_backup)

    restore_parser = subparsers.add_parser("restore", help="Restore vault snapshot to a target path")
    restore_parser.add_argument("--from", dest="from_path", required=True, help="Backup snapshot file path")
    restore_parser.add_argument("--to", help="Restore target sqlite path (required unless --dry-run)")
    restore_parser.add_argument("--dry-run", action="store_true", help="Decrypt and verify chain without writing output")
    restore_parser.add_argument("--force", action="store_true", help="Allow overwrite of existing --to target")
    restore_parser.add_argument(
        "--passphrase-env",
        default="VAULT_BACKUP_PASSPHRASE",
        help="Env var containing backup passphrase for encrypted snapshots",
    )
    restore_parser.add_argument("--project", default="swd-os", help="Project label for restore event")
    restore_parser.set_defaults(func=cmd_restore)

    return parser


def main(argv: Optional[List[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
