# swd-vault CLI

Wrapper command:

```bash
vault/cli/swd-vault <command> [options]
```

Repo-root shortcut:

```bash
./swd-vault <command> [options]
```

`swd-vault init`

- Creates `vault/db/vault.sqlite`
- Applies `vault/schema/001_init.sql`
- Ensures WAL mode

`swd-vault append`

Required:

- `--type`
- `--project`
- `--summary`

Optional:

- `--severity` (default `info`; allowed: `info|notice|warning|critical|fatal`, legacy aliases `warn|blocker` still accepted)
- `--details` JSON object string
- `--evidence` JSON array string
- `--source` (default `manual`)

Append now writes tamper-evident chain fields:

- `prev_hash`
- `hash`
- `details_json.event_class` (deterministic taxonomy: `SYSTEM|INGEST|DOC|TASK|GIT|SEAL|VERIFY|BACKUP|RESTORE|SECURITY|CONFIG`)

Example:

```bash
vault/cli/swd-vault append --type note --project swd-os --severity info \
  --summary "Forge Kick Started - Phase 1 initiated" \
  --details '{"phase":1}'
```

`swd-vault contextpack`

Arguments:

- `--project` (optional)
- `--since` (`7d`, `24h`, `30m`, or timestamp)
- `--max` (default `50`)

Example:

```bash
vault/cli/swd-vault contextpack --project docsmith-extension --since 7d --max 40
```

`swd-vault run`

Capture command execution as Vault memory.

```bash
./swd-vault run --project docsmith-extension -- npm test
./swd-vault run --project vault-dashboard -- npm run build
```

Writes logs to `vault/artifacts/runs/<run_id>.log` and appends:

- `run` event
- `error` event on failure (`severity=critical`)

Profile mode across all configured repos:

```bash
./swd-vault run --all --profile fast
./swd-vault run --all --profile standard
./swd-vault run --all --profile full
./swd-vault run --all --profile fast --continue-on-fail
```

Rules:

- Commands are read only from `repos[].commands.<profile>` in config.
- Commands execute with `cwd = repo.path`.
- Unknown profile or empty profile commands are rejected.
- Default behavior stops on first critical/fatal failure; `--continue-on-fail` overrides.
- A summary `run_summary` event is appended at the end.
- CLI prints `RunSummaryEventId=<id>` and `RunGroupId=<id>` for UI linking.

`swd-vault sweep`

System sweep across configured repos:

```bash
./swd-vault sweep --mode system
```

Appends one `ops_sweep` event per repo + one summary `ops_sweep` event.

`swd-vault ingest bootstrap`

Filesystem backfill from allowlisted paths (`README.md`, `docs/`, `ops/`, `logs/`, `vault/README.md`, `DECISIONS.md`):

```bash
./swd-vault ingest bootstrap --all
./swd-vault ingest bootstrap --project swd-os
```

Markdown files are ingested as `type=doc` with:

- `details_json.path`
- `details_json.sha256`
- `details_json.headings[]`
- `details_json.extracted_tags[]`

`swd-vault ingest git`

Git history backfill:

```bash
./swd-vault ingest git --all --since 2026-01-01
./swd-vault ingest git --project swd-os --since 30d --max-commits 500
```

Creates `type=commit` events with commit hash/author/timestamp/files/stats/risk tags.

`swd-vault ingest notion`

Ingest Notion export bundles (safe default: markdown only):

```bash
./swd-vault ingest notion --all
./swd-vault ingest notion --bundle "SWD OS Export 2026-02-20"
./swd-vault ingest notion --since 30d
```

One-command zip snapshot ingest (auto-extract + optional nested zip extraction):

```bash
./swd-vault ingest notion --zip /path/to/export.zip --bundle notion-export-YYYY-MM-DD
./swd-vault ingest notion --zip /path/to/export.zip --bundle notion-export-YYYY-MM-DD --include-csv
./swd-vault ingest notion --zip /path/to/export.zip --bundle notion-export-YYYY-MM-DD --strict-duplicate
```

Optional extraction root override and replace mode:

```bash
./swd-vault ingest notion --zip /path/to/export.zip --bundle notion-export-YYYY-MM-DD \
  --extract-root /home/habib/notion-exports --force
```

Optional CSV task row ingestion:

```bash
./swd-vault ingest notion --all --include-csv
```

Optional HTML page ingestion (older Notion exports):

```bash
./swd-vault ingest notion --bundle notion-export-OLD-HTML --include-html
```

Behavior:

- Source is recorded as `notion_export`.
- Markdown pages map to `doc` / `decision` events.
- CSV rows map to `task` events when `--include-csv` is enabled.
- HTML/HTM pages map to `doc` / `decision` events when `--include-html` is enabled.
- Dedupe is enforced before insert via event fingerprints, with legacy `path+sha256`/`row_hash` checks retained.
- Stores metadata + headings/tags + redacted excerpt (not full page bodies).
- Appends one `ingest_summary` event per run.
- Zip mode also records `zip_path`, `bundle_dir`, and `nested_zips_extracted` in the summary event.
- `ingest_summary` includes run provenance fields:
  - `run_profile` (defaults to `manual`, overridable with `SWD_VAULT_RUN_PROFILE`)
  - `cli_version` (from `SWD_VAULT_CLI_VERSION` or git short SHA)
  - `host_fingerprint` (non-sensitive host/runtime fingerprint hash)
- Duplicate controls are enforced before processing:
  - bundle duplicate via `zip_sha256` (skip before extraction),
  - file/row duplicate via `details_json.fingerprint`,
  - legacy fallback checks (`path+sha256` and `row_hash`) remain enabled.
- Fully duplicate runs (no inserts) do not append a new summary event.
- Counter contract guardrail:
  - on inconsistent counters (e.g., `scanned < inserted + skipped`), a non-blocking `system` warning event is appended.

Bundle report mode (no DB writes):

```bash
./swd-vault ingest notion --bundle notion-export-2026-02-20 --report
```

`swd-vault verify chain`

Verify append-only chain integrity:

```bash
./swd-vault verify chain
```

Verification now appends a `verify` event (and `seal` event when `--seal-missing` updates rows).

Optional one-time migration helper for older rows without chain hashes:

```bash
./swd-vault verify chain --seal-missing --project swd-os
```

`swd-vault backup`

Create snapshot backups of the Vault DB:

```bash
./swd-vault backup --dest ~/swd-backups/vault
```

Encrypted backup (gpg AES-256):

```bash
export VAULT_BACKUP_PASSPHRASE="long-random-passphrase"
./swd-vault backup --encrypt --dest ~/swd-backups/vault
```

Apply retention rotation (7 daily / 4 weekly / 6 monthly):

```bash
./swd-vault backup --encrypt --dest ~/swd-backups/vault --rotate
```

Encrypted backups append `type=backup` events with evidence paths and restore hints.

`swd-vault restore`

Restore drill without writing output:

```bash
export VAULT_BACKUP_PASSPHRASE="long-random-passphrase"
./swd-vault restore --from ~/swd-backups/vault/vault-20260219T204815Z.sqlite.gpg --dry-run
```

Restore to an explicit file path:

```bash
export VAULT_BACKUP_PASSPHRASE="long-random-passphrase"
./swd-vault restore --from ~/swd-backups/vault/vault-20260219T204815Z.sqlite.gpg --to /tmp/vault-restore.sqlite
```

Safety rules:

- `--to` is required unless `--dry-run` is set.
- Existing restore target requires `--force`.
- Live DB overwrite requires `--force`.
