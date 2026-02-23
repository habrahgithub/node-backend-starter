import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

function getWorkspaceRoot() {
  return path.resolve(MODULE_DIR, "..", "..", "..");
}

function getConfigPath() {
  return path.resolve(MODULE_DIR, "..", "..", "config", "vault.config.json");
}

function getConfig() {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getDbPath() {
  const fallback = path.resolve(getWorkspaceRoot(), "vault", "db", "vault.sqlite");
  const config = getConfig();
  if (!config?.vaultDbPath || typeof config.vaultDbPath !== "string") return fallback;
  return path.resolve(getWorkspaceRoot(), config.vaultDbPath);
}

function openDb() {
  const dbPath = getDbPath();
  if (!fs.existsSync(dbPath)) return null;
  return new Database(dbPath, { readonly: true, fileMustExist: true });
}

function parseSinceToModifier(since) {
  const val = String(since || "").trim().toLowerCase();
  if (/^\d+d$/.test(val)) return `-${Number.parseInt(val.slice(0, -1), 10)} days`;
  if (/^\d+h$/.test(val)) return `-${Number.parseInt(val.slice(0, -1), 10)} hours`;
  if (/^\d+m$/.test(val)) return `-${Number.parseInt(val.slice(0, -1), 10)} minutes`;
  return "-7 days";
}

const SEVERITY_CANONICAL = {
  info: "info",
  notice: "notice",
  warning: "warning",
  warn: "warning",
  critical: "critical",
  blocker: "critical",
  fatal: "fatal"
};

const SEVERITY_ORDER = ["info", "notice", "warning", "critical", "fatal"];
const CRITICAL_SEVERITIES = new Set(["critical", "fatal", "blocker"]);
const WARNING_SEVERITIES = new Set(["notice", "warning", "warn"]);
const FAILURE_SEVERITIES = new Set(["warning", "critical", "fatal", "warn", "blocker"]);

function normalizeSeverity(value) {
  const key = String(value || "").trim().toLowerCase();
  return SEVERITY_CANONICAL[key] || key || "info";
}

function severityFilterValues(selectedSeverity) {
  const normalized = normalizeSeverity(selectedSeverity);
  if (normalized === "warning") return ["warning", "warn"];
  if (normalized === "critical") return ["critical", "blocker"];
  return [normalized];
}

function severitySortIndex(value) {
  const idx = SEVERITY_ORDER.indexOf(value);
  return idx >= 0 ? idx : 999;
}

function hoursSince(ts) {
  if (!ts) return null;
  const parsed = Date.parse(String(ts).replace(" ", "T") + "Z");
  if (Number.isNaN(parsed)) return null;
  return Math.max(0, Math.floor((Date.now() - parsed) / (1000 * 60 * 60)));
}

function safeRate(numerator, denominator) {
  if (!Number.isFinite(denominator) || denominator <= 0) return null;
  if (!Number.isFinite(numerator) || numerator < 0) return null;
  return numerator / denominator;
}

function safeJsonParse(value, fallback) {
  if (!value || typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map((item) => sortDeep(item));
  if (value && typeof value === "object" && value.constructor === Object) {
    const output = {};
    for (const key of Object.keys(value).sort()) {
      output[key] = sortDeep(value[key]);
    }
    return output;
  }
  return value;
}

function ensureAscii(jsonString) {
  return jsonString.replace(/[\u007f-\uffff]/g, (ch) => {
    const code = ch.charCodeAt(0).toString(16).padStart(4, "0");
    return `\\u${code}`;
  });
}

function canonicalJson(value) {
  return ensureAscii(JSON.stringify(sortDeep(value)));
}

function buildCanonicalEventString(row, details, evidencePaths) {
  return canonicalJson({
    id: Number(row.id || 0),
    ts: String(row.ts || ""),
    type: String(row.type || ""),
    project: String(row.project || ""),
    severity: String(row.severity || ""),
    summary: String(row.summary || ""),
    details,
    evidence_paths: evidencePaths,
    source: String(row.source || "")
  });
}

function computeChainHash(prevHash, canonicalEvent) {
  return createHash("sha256").update(`${prevHash}|${canonicalEvent}`, "utf8").digest("hex");
}

function verifyChain(rows) {
  let previousHash = "";
  let checked = 0;
  for (const row of rows) {
    checked += 1;
    const rowId = Number(row.id || 0);
    const currentPrevHash = String(row.prev_hash || "");
    if (currentPrevHash !== previousHash) {
      return {
        ok: false,
        checkedEvents: checked,
        brokenAtId: rowId,
        reason: "prev_hash_mismatch",
        expectedPrevHash: previousHash,
        actualPrevHash: currentPrevHash
      };
    }

    const details = safeJsonParse(row.details_json, {});
    const evidencePaths = safeJsonParse(row.evidence_paths_json, []);
    const normalizedEvidence = Array.isArray(evidencePaths) ? evidencePaths.map((item) => String(item)) : [];
    const canonicalEvent = buildCanonicalEventString(row, details, normalizedEvidence);
    const expectedHash = computeChainHash(previousHash, canonicalEvent);
    const currentHash = String(row.hash || "");
    if (!currentHash) {
      return {
        ok: false,
        checkedEvents: checked,
        brokenAtId: rowId,
        reason: "missing_hash",
        expectedHash,
        actualHash: currentHash
      };
    }
    if (currentHash !== expectedHash) {
      return {
        ok: false,
        checkedEvents: checked,
        brokenAtId: rowId,
        reason: "hash_mismatch",
        expectedHash,
        actualHash: currentHash
      };
    }
    previousHash = expectedHash;
  }

  return {
    ok: true,
    checkedEvents: checked,
    headHash: previousHash
  };
}

function withDb(fn, fallback) {
  const db = openDb();
  if (!db) return fallback;
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

export function getRunProfilesMeta() {
  const config = getConfig();
  const repos = Array.isArray(config?.repos) ? config.repos : [];
  const parsedRepos = repos
    .filter((repo) => repo && typeof repo === "object")
    .map((repo) => {
      const commands = repo.commands && typeof repo.commands === "object" ? repo.commands : {};
      const profiles = Object.entries(commands)
        .filter(([, value]) => Array.isArray(value) && value.length > 0)
        .map(([name]) => name);
      return {
        name: typeof repo.name === "string" ? repo.name : "",
        path: typeof repo.path === "string" ? repo.path : "",
        profiles
      };
    })
    .filter((repo) => repo.name);

  const profileSet = new Set();
  for (const repo of parsedRepos) {
    for (const profile of repo.profiles) profileSet.add(profile);
  }

  return {
    repos: parsedRepos,
    profiles: Array.from(profileSet).sort()
  };
}

export function getStatusWindow() {
  return withDb(
    (db) => {
      const since = "-7 days";
      const row = db
        .prepare(
          `
          SELECT
            COUNT(*) AS total_events,
            SUM(CASE WHEN LOWER(severity) IN ('critical','fatal','blocker') THEN 1 ELSE 0 END) AS criticals,
            SUM(CASE WHEN LOWER(severity) IN ('warning','warn','notice') THEN 1 ELSE 0 END) AS warnings,
            MAX(ts) AS last_ts
          FROM events
          WHERE datetime(ts) >= datetime('now', ?)
          `
        )
        .get(since);

      const lastSweep = db
        .prepare(
          `
          SELECT ts, project, severity, summary
          FROM events
          WHERE type = 'ops_sweep'
          ORDER BY datetime(ts) DESC, id DESC
          LIMIT 1
          `
        )
        .get();

      const criticals = Number(row?.criticals || 0);
      const warnings = Number(row?.warnings || 0);
      const releaseStatus = criticals > 0 ? "RED" : warnings > 0 ? "YELLOW" : "GREEN";
      const chainRows = db
        .prepare(
          `
          SELECT id, ts, type, project, severity, summary, details_json, evidence_paths_json, source, prev_hash, hash
          FROM events
          ORDER BY id ASC
          `
        )
        .all();
      const chainStatus = verifyChain(chainRows);
      const chainHeight = chainRows.length;

      const backupRow = db
        .prepare(
          `
          SELECT ts
          FROM events
          WHERE type = 'backup'
          ORDER BY datetime(ts) DESC, id DESC
          LIMIT 1
          `
        )
        .get();

      const sealRow = db
        .prepare(
          `
          SELECT ts
          FROM events
          WHERE type = 'seal'
          ORDER BY datetime(ts) DESC, id DESC
          LIMIT 1
          `
        )
        .get();

      const failedRunsRow = db
        .prepare(
          `
          SELECT COUNT(*) AS failed_runs
          FROM events
          WHERE type = 'run'
            AND datetime(ts) >= datetime('now', ?)
            AND LOWER(severity) IN ('warning','critical','fatal','warn','blocker')
          `
        )
        .get("-7 days");

      const duplicateRow = db
        .prepare(
          `
          SELECT
            COALESCE(SUM(
              COALESCE(json_extract(details_json, '$.md_skipped'), 0) +
              COALESCE(json_extract(details_json, '$.html_skipped'), 0) +
              COALESCE(json_extract(details_json, '$.csv_rows_skipped'), 0)
            ), 0) AS skipped_total,
            COALESCE(SUM(
              COALESCE(json_extract(details_json, '$.md_inserted'), 0) +
              COALESCE(json_extract(details_json, '$.html_inserted'), 0) +
              COALESCE(json_extract(details_json, '$.csv_rows_inserted'), 0)
            ), 0) AS inserted_total
          FROM events
          WHERE type = 'ingest_summary'
          `
        )
        .get();

      const recentCriticalEvents = db
        .prepare(
          `
          SELECT id, ts, type, project, severity, summary
          FROM events
          WHERE LOWER(severity) IN ('critical','fatal','blocker')
          ORDER BY datetime(ts) DESC, id DESC
          LIMIT 10
          `
        )
        .all()
        .map((rowItem) => ({ ...rowItem, severity: normalizeSeverity(rowItem.severity) }));

      const recentIngestRuns = db
        .prepare(
          `
          SELECT id, ts, severity, summary, details_json
          FROM events
          WHERE type = 'ingest_summary'
          ORDER BY id DESC
          LIMIT 10
          `
        )
        .all()
        .map((rowItem) => {
          const details = safeJsonParse(rowItem.details_json, {});
          const bundles = Array.isArray(details.bundles) ? details.bundles.map((item) => String(item)) : [];
          const mdScanned = Number(details.md_scanned || 0);
          const mdInserted = Number(details.md_inserted || 0);
          const mdSkipped = Number(details.md_skipped || 0);
          const htmlScanned = Number(details.html_scanned || 0);
          const htmlInserted = Number(details.html_inserted || 0);
          const htmlSkipped = Number(details.html_skipped || 0);
          const csvRowsInserted = Number(details.csv_rows_inserted || 0);
          const csvRowsSkipped = Number(details.csv_rows_skipped || 0);
          const csvRowsScanned = Number(details.csv_rows_scanned || csvRowsInserted + csvRowsSkipped);
          const totalInserted = mdInserted + htmlInserted + csvRowsInserted;
          const totalScanned = mdScanned + htmlScanned + csvRowsScanned;
          const totalSkipped = mdSkipped + htmlSkipped + csvRowsSkipped;
          const duplicateOnly = totalScanned > 0 && totalInserted === 0 && totalSkipped === totalScanned;
          const counterRegression = totalScanned > 0 && totalInserted === 0 && totalSkipped === 0;
          const htmlPathMismatch = htmlScanned > 0 && htmlInserted === 0 && htmlSkipped === 0;
          const bundleLabel =
            bundles.length === 1 ? bundles[0] : bundles.length > 1 ? `${bundles.length} bundles` : "-";
          const runProfile = String(details.run_profile || "manual");
          const cliVersion = String(details.cli_version || "");
          const hostFingerprint = String(details.host_fingerprint || "");
          return {
            ...rowItem,
            severity: normalizeSeverity(rowItem.severity),
            details,
            bundles,
            bundleLabel,
            runProfile,
            cliVersion,
            hostFingerprint,
            hostFingerprintShort: hostFingerprint ? hostFingerprint.slice(0, 8) : "",
            mdScanned,
            mdInserted,
            mdSkipped,
            htmlScanned,
            htmlInserted,
            htmlSkipped,
            csvRowsScanned,
            csvRowsInserted,
            csvRowsSkipped,
            totalScanned,
            totalInserted,
            totalSkipped,
            duplicateOnly,
            counterRegression,
            htmlPathMismatch
          };
        });

      const latestIngest = recentIngestRuns.length > 0 ? recentIngestRuns[0] : null;
      const mdScanned = Number(latestIngest?.mdScanned || 0);
      const mdInserted = Number(latestIngest?.mdInserted || 0);
      const mdSkipped = Number(latestIngest?.mdSkipped || 0);
      const htmlScanned = Number(latestIngest?.htmlScanned || 0);
      const htmlInserted = Number(latestIngest?.htmlInserted || 0);
      const htmlSkipped = Number(latestIngest?.htmlSkipped || 0);
      const csvRowsInserted = Number(latestIngest?.csvRowsInserted || 0);
      const csvRowsSkipped = Number(latestIngest?.csvRowsSkipped || 0);
      const csvRowsScanned = Number(latestIngest?.csvRowsScanned || 0);
      const totalInserted = Number(latestIngest?.totalInserted || 0);
      const totalScanned = Number(latestIngest?.totalScanned || 0);
      const totalSkipped = Number(latestIngest?.totalSkipped || 0);
      const coverageFlags = [];
      if (totalScanned > 0 && totalSkipped === totalScanned) {
        coverageFlags.push({ code: "duplicate_only", level: "warning", label: "No new content (duplicate-only run)" });
      }
      if (totalScanned > 0 && totalInserted === 0 && totalSkipped === 0) {
        coverageFlags.push({
          code: "counter_regression",
          level: "warning",
          label: "Possible counter regression / missing details_json"
        });
      }
      if (htmlScanned > 0 && htmlInserted === 0 && htmlSkipped === 0) {
        coverageFlags.push({ code: "html_path_mismatch", level: "warning", label: "HTML path mismatch" });
      }

      const backupFreshnessHours = hoursSince(backupRow?.ts || null);
      const sealFreshnessHours = hoursSince(sealRow?.ts || null);
      const duplicatesSkipped = Number(duplicateRow?.skipped_total || 0);
      const duplicatesProcessed = duplicatesSkipped + Number(duplicateRow?.inserted_total || 0);
      const duplicateSuppressionRatio = duplicatesProcessed > 0 ? duplicatesSkipped / duplicatesProcessed : null;
      const failedRuns7d = Number(failedRunsRow?.failed_runs || 0);

      let healthScore = chainStatus.ok ? 100 : 0;
      if (healthScore > 0) {
        if (backupFreshnessHours === null || backupFreshnessHours > 24) healthScore -= 15;
        if (backupFreshnessHours !== null && backupFreshnessHours > 72) healthScore -= 20;
        if (failedRuns7d > 0) healthScore -= Math.min(20, failedRuns7d * 4);
        if (criticals > 0) healthScore -= Math.min(30, criticals * 5);
      }
      healthScore = Math.max(0, Math.min(100, healthScore));
      const healthStatus = healthScore >= 90 ? "GREEN" : healthScore >= 70 ? "YELLOW" : "RED";

      return {
        hasDb: true,
        totalEvents: Number(row?.total_events || 0),
        blockers: criticals,
        warns: warnings,
        lastTs: row?.last_ts || null,
        releaseStatus,
        lastSweep: lastSweep || null,
        chainStatus,
        health: {
          score: healthScore,
          status: healthStatus,
          chainContinuity: chainStatus.ok,
          chainHeight,
          backupFreshnessHours,
          sealFreshnessHours,
          failedRuns7d,
          duplicateSuppressionRatio,
          duplicateSuppressed: duplicatesSkipped,
          duplicateProcessed: duplicatesProcessed
        },
        formatCoverage: latestIngest
          ? {
              eventId: latestIngest.id,
              ts: latestIngest.ts,
              bundleLabel: latestIngest.bundleLabel,
              provenance: {
                runProfile: latestIngest.runProfile,
                cliVersion: latestIngest.cliVersion,
                hostFingerprint: latestIngest.hostFingerprint,
                hostFingerprintShort: latestIngest.hostFingerprintShort
              },
              md: { scanned: mdScanned, inserted: mdInserted, skipped: mdSkipped },
              html: { scanned: htmlScanned, inserted: htmlInserted, skipped: htmlSkipped },
              csvRows: { scanned: csvRowsScanned, inserted: csvRowsInserted, skipped: csvRowsSkipped },
              totalInserted,
              totalScanned,
              totalSkipped,
              rates: {
                mdInsert: safeRate(mdInserted, mdScanned),
                mdSkip: safeRate(mdSkipped, mdScanned),
                htmlInsert: safeRate(htmlInserted, htmlScanned),
                htmlSkip: safeRate(htmlSkipped, htmlScanned),
                csvInsert: safeRate(csvRowsInserted, csvRowsScanned),
                csvSkip: safeRate(csvRowsSkipped, csvRowsScanned),
                totalInsert: safeRate(totalInserted, totalScanned),
                totalSkip: safeRate(totalSkipped, totalScanned)
              },
              flags: coverageFlags
            }
          : null,
        recentCriticalEvents,
        recentIngestRuns
      };
    },
    {
      hasDb: false,
      totalEvents: 0,
      blockers: 0,
      warns: 0,
      lastTs: null,
      releaseStatus: "GREEN",
      lastSweep: null,
      chainStatus: { ok: true, checkedEvents: 0, headHash: "" },
      health: {
        score: 100,
        status: "GREEN",
        chainContinuity: true,
        chainHeight: 0,
        backupFreshnessHours: null,
        sealFreshnessHours: null,
        failedRuns7d: 0,
        duplicateSuppressionRatio: null,
        duplicateSuppressed: 0,
        duplicateProcessed: 0
      },
      formatCoverage: null,
      recentCriticalEvents: [],
      recentIngestRuns: []
    }
  );
}

export function getTimelineData({ project = "", type = "", severity = "", eventClass = "", since = "7d", max = 200 } = {}) {
  return withDb(
    (db) => {
      const where = [];
      const params = [];

      const sinceModifier = parseSinceToModifier(since);
      where.push("datetime(ts) >= datetime('now', ?)");
      params.push(sinceModifier);

      if (project) {
        where.push("project = ?");
        params.push(project);
      }
      if (type) {
        where.push("type = ?");
        params.push(type);
      }
      if (eventClass) {
        where.push("COALESCE(json_extract(details_json, '$.event_class'), '') = ?");
        params.push(String(eventClass).toUpperCase());
      }
      if (severity) {
        const values = severityFilterValues(severity);
        const placeholders = values.map(() => "?").join(", ");
        where.push(`LOWER(severity) IN (${placeholders})`);
        for (const value of values) params.push(value);
      }

      const sql = `
        SELECT id, ts, type, project, severity, summary, details_json, evidence_paths_json, source
        FROM events
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY datetime(ts) DESC, id DESC
        LIMIT ?
      `;
      const rows = db.prepare(sql).all(...params, Number(max || 200));
      const events = rows.map((row) => ({
        ...row,
        severity: normalizeSeverity(row.severity),
        details: safeJsonParse(row.details_json, {}),
        evidence_paths: safeJsonParse(row.evidence_paths_json, [])
      }));

      const projects = db
        .prepare("SELECT DISTINCT project FROM events WHERE project <> '' ORDER BY project ASC")
        .all()
        .map((r) => r.project);
      const types = db
        .prepare("SELECT DISTINCT type FROM events WHERE type <> '' ORDER BY type ASC")
        .all()
        .map((r) => r.type);
      const classes = db
        .prepare(
          `
          SELECT DISTINCT COALESCE(json_extract(details_json, '$.event_class'), '') AS c
          FROM events
          WHERE COALESCE(json_extract(details_json, '$.event_class'), '') <> ''
          ORDER BY c ASC
          `
        )
        .all()
        .map((r) => r.c);
      const severities = Array.from(
        new Set(
          db
            .prepare("SELECT DISTINCT severity FROM events WHERE severity <> ''")
            .all()
            .map((r) => normalizeSeverity(r.severity))
        )
      ).sort((a, b) => severitySortIndex(a) - severitySortIndex(b));

      return {
        hasDb: true,
        events,
        filters: { projects, types, classes, severities }
      };
    },
    { hasDb: false, events: [], filters: { projects: [], types: [], classes: [], severities: [] } }
  );
}

export function getRunsData({ project = "", since = "30d", runGroupId = "", max = 200 } = {}) {
  return withDb(
    (db) => {
      const where = ["type = 'run'", "datetime(ts) >= datetime('now', ?)"];
      const params = [parseSinceToModifier(since)];
      if (project) {
        where.push("project = ?");
        params.push(project);
      }
      if (runGroupId) {
        where.push("json_extract(details_json, '$.run_group_id') = ?");
        params.push(runGroupId);
      }
      const rows = db
        .prepare(
          `
          SELECT id, ts, project, severity, summary, details_json, evidence_paths_json, source
          FROM events
          WHERE ${where.join(" AND ")}
          ORDER BY datetime(ts) DESC, id DESC
          LIMIT ?
          `
        )
        .all(...params, Number(max || 200));

      const projects = db
        .prepare("SELECT DISTINCT project FROM events WHERE type = 'run' AND project <> '' ORDER BY project ASC")
        .all()
        .map((r) => r.project);

      const runs = rows.map((row) => {
        const details = safeJsonParse(row.details_json, {});
        const evidencePaths = safeJsonParse(row.evidence_paths_json, []);
        return {
          ...row,
          severity: normalizeSeverity(row.severity),
          details,
          evidence_paths: evidencePaths,
          command_text: details.command_text || "",
          exit_code: details.exit_code,
          duration_ms: details.duration_ms,
          log_path: evidencePaths.length > 0 ? evidencePaths[0] : ""
        };
      });
      return { hasDb: true, runs, filters: { projects } };
    },
    { hasDb: false, runs: [], filters: { projects: [] } }
  );
}

export function getDecisionsData({ tag = "", since = "90d", max = 200 } = {}) {
  return withDb(
    (db) => {
      const where = [
        "(type = 'decision' OR type = 'ops_sweep')",
        "datetime(ts) >= datetime('now', ?)"
      ];
      const params = [parseSinceToModifier(since)];
      if (tag) {
        where.push(
          "(COALESCE(json_extract(details_json, '$.tag'), json_extract(details_json, '$.lane'), '') = ?)"
        );
        params.push(tag);
      }
      const rows = db
        .prepare(
          `
          SELECT id, ts, project, type, severity, summary, details_json, source
          FROM events
          WHERE ${where.join(" AND ")}
          ORDER BY datetime(ts) DESC, id DESC
          LIMIT ?
          `
        )
        .all(...params, Number(max || 200));

      const decisions = rows.map((row) => {
        const details = safeJsonParse(row.details_json, {});
        return {
          ...row,
          severity: normalizeSeverity(row.severity),
          details,
          tag: details.tag || details.lane || ""
        };
      });

      return { hasDb: true, decisions };
    },
    { hasDb: false, decisions: [] }
  );
}

export function getBlockersData({ since = "30d", max = 200 } = {}) {
  return withDb(
    (db) => {
      const rows = db
        .prepare(
          `
          SELECT
            COALESCE(json_extract(details_json, '$.fingerprint'), '(no-fingerprint)') AS fingerprint,
            COUNT(*) AS count,
            MIN(ts) AS first_seen,
            MAX(ts) AS last_seen,
            MAX(project) AS sample_project,
            MAX(summary) AS sample_summary
          FROM events
          WHERE LOWER(severity) IN ('critical','fatal','blocker')
            AND datetime(ts) >= datetime('now', ?)
          GROUP BY fingerprint
          ORDER BY count DESC, datetime(last_seen) DESC
          LIMIT ?
          `
        )
        .all(parseSinceToModifier(since), Number(max || 200));
      return { hasDb: true, groups: rows };
    },
    { hasDb: false, groups: [] }
  );
}

export function getProjectsData({ since = "30d" } = {}) {
  return withDb(
    (db) => {
      const projects = db
        .prepare("SELECT DISTINCT project FROM events WHERE project <> '' ORDER BY project ASC")
        .all()
        .map((r) => r.project);

      const sinceModifier = parseSinceToModifier(since);
      const cards = projects.map((project) => {
        const lastActivity = db
          .prepare(
            `
            SELECT ts, type, severity, summary
            FROM events
            WHERE project = ?
            ORDER BY datetime(ts) DESC, id DESC
            LIMIT 1
            `
          )
          .get(project);

        const blockers = db
          .prepare(
            `
            SELECT COUNT(*) AS c
            FROM events
            WHERE project = ?
              AND LOWER(severity) IN ('critical','fatal','blocker')
              AND datetime(ts) >= datetime('now', ?)
            `
          )
          .get(project, sinceModifier);

        const lastRun = db
          .prepare(
            `
            SELECT ts, severity, summary, details_json
            FROM events
            WHERE project = ?
              AND type = 'run'
            ORDER BY datetime(ts) DESC, id DESC
            LIMIT 1
            `
          )
          .get(project);

        const runDetails = safeJsonParse(lastRun?.details_json || "", {});
        const lastCommit = db
          .prepare(
            `
            SELECT ts, summary, details_json
            FROM events
            WHERE project = ?
              AND type = 'commit'
            ORDER BY datetime(ts) DESC, id DESC
            LIMIT 1
            `
          )
          .get(project);
        const commitDetails = safeJsonParse(lastCommit?.details_json || "", {});
        return {
          project,
          last_activity_ts: lastActivity?.ts || "",
          last_activity_summary: lastActivity?.summary || "",
          blockers: Number(blockers?.c || 0),
          last_run_ts: lastRun?.ts || "",
          last_run_severity: normalizeSeverity(lastRun?.severity || ""),
          last_run_summary: lastRun?.summary || "",
          last_run_exit_code: runDetails.exit_code,
          last_commit_ts: lastCommit?.ts || "",
          last_commit_summary: lastCommit?.summary || "",
          last_commit_hash: commitDetails.commit_hash || ""
        };
      });

      cards.sort((a, b) => String(b.last_activity_ts).localeCompare(String(a.last_activity_ts)));
      return { hasDb: true, cards };
    },
    { hasDb: false, cards: [] }
  );
}

export function getRecentRunSummaryEvents(limit = 5) {
  return withDb(
    (db) => {
      const rows = db
        .prepare(
          `
          SELECT id, ts, project, severity, summary, details_json
          FROM events
          WHERE type = 'run_summary'
          ORDER BY datetime(ts) DESC, id DESC
          LIMIT ?
          `
        )
        .all(Number(limit || 5));
      return rows.map((row) => {
        const details = safeJsonParse(row.details_json, {});
        return {
          ...row,
          severity: normalizeSeverity(row.severity),
          details,
          profile: details.profile || "",
          run_group_id: details.run_group_id || ""
        };
      });
    },
    []
  );
}

export function getEventById(eventId) {
  return withDb(
    (db) => {
      const row = db
        .prepare(
          `
          SELECT id, ts, type, project, severity, summary, details_json, evidence_paths_json, source
          FROM events
          WHERE id = ?
          LIMIT 1
          `
        )
        .get(Number(eventId));
      if (!row) return null;
      return {
        ...row,
        severity: normalizeSeverity(row.severity),
        details: safeJsonParse(row.details_json, {}),
        evidence_paths: safeJsonParse(row.evidence_paths_json, [])
      };
    },
    null
  );
}
