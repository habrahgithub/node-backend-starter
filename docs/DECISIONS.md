# Decisions

Record decisions that affect repo behavior, structure, or policy.

Template:
- YYYY-MM-DD: Decision statement. Rationale.

Entries:
- 2026-02-06: Established governance docs, skills baseline, and stricter ignore rules. Keeps changes small and audit friendly.
- 2026-02-19: Standardized `social-marketing-content-studio` as a deterministic v1.0 pipeline with required inputs, QA gates, and platform export contract.
- 2026-02-19: Upgraded `operations-control-plane` to governance-grade deterministic flow with context snapshot, housekeeping blocks, telemetry triage, Warden logs, and release-check mode.
- 2026-02-19: Upgraded `testing-governance-suite` to deterministic v1.0 test-pyramid execution with strict stop-on-blocker behavior, governance/SOP/env/state gates, mode contracts, and DocSmith golden pack gate.
- 2026-02-19: Added `vault/` local-first append-only infrastructure (SQLite WAL + migration-driven schema + CLI + local War Room dashboard shell) with DB/artifact paths excluded from git.
- 2026-02-19: Extended Vault to Phase 2 execution cockpit primitives: `swd-vault run`, `swd-vault sweep`, fingerprinted non-info events, and War Room pages for runs, decisions, blockers, and project health.
- 2026-02-19: Added Phase 3 historical ingestion primitives: repo-allowlisted bootstrap doc/log backfill, git commit backfill with dedupe/risk tags, and contextpack sections for recent commits/key docs/recurring failures.
- 2026-02-19: Added Phase 4 profile-based `run --all` orchestration from repo config commands with strict validation, stop-on-failure default, optional continue-on-fail, and summary `run_summary` events.
- 2026-02-19: Added Phase 4.5 War Room control route (`/run-profiles`) plus local-only execution API and event detail pages, enabling safe profile-triggered runs with links to summary/run evidence.
- 2026-02-19: Hardened War Room profile triggers with optional `VAULT_RUN_TOKEN` enforcement on `/api/run-profiles` and moved UI execution to a server action so secrets are not exposed client-side.
- 2026-02-19: Activated Phase 6A/6B vault hardening with append-time hash chaining + `verify chain` integrity checks, status-page chain health indicator, and encrypted backup snapshots via `swd-vault backup --encrypt`.
- 2026-02-19: Added Phase 6C backup operations: retention rotation (`--rotate`, 7/4/6 policy) and restore drill commands (`restore --dry-run` / `--to`) with chain verification and overwrite guardrails.
- 2026-02-19: Added Phase 5A Notion export ingestion (`ingest notion`) with markdown-first default, optional CSV task ingest, dedupe by source path/content hash, redacted excerpts, and `ingest_summary` audit events.
- 2026-02-20: Added Phase 5B one-command Notion zip snapshot ingest (`ingest notion --zip --bundle`) with deterministic extraction, nested zip handling, bundle-dir overwrite guardrails (`--force`), and provenance-rich summary events.
- 2026-02-20: Hardened Notion ingest duplicate controls to reject already-ingested zip bundles pre-extraction (`zip_sha256`), fingerprint markdown/CSV records before insert, and suppress no-op summary events on fully duplicate runs.
- 2026-02-20: Extended Notion ingestion to support older HTML exports via `--include-html`, storing metadata/excerpts only with fingerprint dedupe and no-op summary suppression.
- 2026-02-20: Introduced Phase 7 operational hardening baseline: deterministic event taxonomy stamping (`details_json.event_class`), normalized severity model (`info|notice|warning|critical|fatal` with legacy aliases), verify/seal audit events, and War Room Vault Health/critical-ingest panels.
- 2026-02-20: Extended War Room ingest observability with latest-ingest format coverage ratios, duplicate/anomaly badges, and last-10 ingest state columns (bundle, inserted count, duplicate-only marker), using monotonic `id` ordering for latest selection.
- 2026-02-20: Added ingest provenance fields to Notion `ingest_summary` (`run_profile`, `cli_version`, `host_fingerprint`) and a non-blocking counter-contract warning event for inconsistent ingest counters.
- 2026-02-20: Exposed ingest provenance in War Room status via optional details toggles for latest ingest and last-10 ingests, showing run profile, CLI version, and shortened host fingerprint.
- 2026-02-20: Added minimal forensic provenance toggles to `/timeline` for `ingest_summary`, `backup`, and `restore` rows without adding new list columns.
- 2026-02-20: Froze Vault v1.0 baseline and added canonical governance artifacts (`docs/VAULT_V1_FREEZE_CHECKLIST.md`, `docs/PULSE_PHASE1_READONLY_CONNECTOR_CONTRACT.md`) plus War Room footer build markers (`VAULT_SCHEMA_VERSION`, `VAULT_BUILD_ID`).
- 2026-02-20: Pinned War Room runtime to Node 18 (`vault/dashboard/.nvmrc`, `engines.node`) and documented WSL native rebuild flow for `better-sqlite3` ABI alignment to keep dashboard runtime deterministic.
- 2026-02-20: Published `docs/REPO_OVERLAP_INTELLIGENCE_PACK_V1.md` and `docs/SWD_LOG_BUNDLE_SPEC_V1.md` as canonical inputs for consolidation planning and NDJSON-based governance-log ingestion.
- 2026-02-20: Triaged `npm audit` for `vault/dashboard`: upgraded `next` from `14.2.24` to `14.2.35` to remove critical advisories; residual high advisory (`GHSA-9g9p-9gw9-jx7f`, `GHSA-h25m-26qc-wcjf`) requires breaking major upgrade and is accepted short-term due localhost-only War Room scope, with remediation trigger set to next planned framework-major cycle.
- 2026-02-20: Enforced local-first connector policy by removing cloud-connector references from active docs/specs, removing connector checkup execution from root `package.json`, deleting connector-specific repo/skill assets from this workspace, and introducing a single deferred connector marker in `docs/ROADMAP_CONNECTORS.md`.
- 2026-02-20: Added canonical operator artifact `docs/SWD_OS_OPERATOR_MANUAL.md` with local-first runtime procedures, integrity/backup/restore playbooks, anomaly handling, and PDF export contract aligned to Vault v1.0 freeze.
- 2026-02-20: Upgraded `docs/SWD_OS_OPERATOR_MANUAL.md` to enterprise audit-grade format with document control metadata, controlled distribution policy, revision history table, and formal approval/sign-off block.
