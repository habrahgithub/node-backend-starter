# SWD Vault Contract

The Vault is a local-first, append-only memory system for SWD operations.

## What Gets Stored

- Structured operational events in `vault/db/vault.sqlite`.
- Source registry entries (repo paths, export paths, log origins).
- Ingestion checkpoints (last processed cursors per source).
- Evidence references as file paths (not full binary artifacts in the DB).
- Generated context packs for operator handoff and LLM prompts.

## What Never Gets Stored

- Secrets, API keys, tokens, private keys, or passwords.
- Raw `.env` content.
- Full large artifacts (Playwright blobs, build artifacts, DB dumps) in SQLite.

## Data Handling Rules

- Local-first only.
- `events` is append-only; updates/deletes are blocked at the DB layer.
- Payloads are JSON so ingestion can evolve without schema churn.
- Redaction is required before append for any sensitive fields.
- Every event is hash-chained (`prev_hash` + canonical payload -> `hash`) for tamper evidence.

## Backups

- The SQLite DB file is excluded from git.
- Backup strategy is encrypted snapshots (phase 6 hardening).
- Restores must preserve event order and source checkpoints.
- CLI backup command:
  - `./swd-vault backup --encrypt --dest ~/swd-backups/vault`
  - requires `VAULT_BACKUP_PASSPHRASE` env var for encrypted mode.
  - rotation support: `./swd-vault backup --encrypt --dest ~/swd-backups/vault --rotate`
    - default retention is 7 daily / 4 weekly / 6 monthly.
- CLI restore drill:
  - `./swd-vault restore --from <snapshot.sqlite.gpg> --dry-run`
  - `./swd-vault restore --from <snapshot.sqlite.gpg> --to <target.sqlite>`
  - restore never overwrites existing targets or live DB without `--force`.
- Chain verification command:
  - `./swd-vault verify chain`

## Repo Paths

- DB: `vault/db/vault.sqlite`
- Schema migrations: `vault/schema/*.sql`
- CLI: `vault/cli/swd_vault.py`
- Config: `vault/config/vault.config.json`
- Runtime artifacts: `vault/artifacts/`
- Notion exports input root: `notion.exportsPath` in `vault/config/vault.config.json`

## Governance References

- Vault v1.0 freeze checklist: `docs/VAULT_V1_FREEZE_CHECKLIST.md`
- Pulse Phase 1 read-only connector contract: `docs/PULSE_PHASE1_READONLY_CONNECTOR_CONTRACT.md`
