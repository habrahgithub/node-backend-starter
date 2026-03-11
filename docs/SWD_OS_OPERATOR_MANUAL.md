# SWD OS - Operator Manual

Document Status: Controlled
Version: v1.0 (Local-First Freeze Baseline)
Schema Version: `{{VAULT_SCHEMA_VERSION}}`
Build ID: `{{VAULT_BUILD_ID}}`
Node Runtime (Dashboard): `18.19.1`
Last Updated: 2026-02-20
Document ID: `SWD-OS-OPS-MANUAL-V1`
Classification: Internal - Controlled
Owner: SWD Operations
Approved By: CTO
Effective Date: 2026-02-20
Review Cycle: Quarterly

## 0. Document Control

### 0.1 Purpose of This Document

This manual is the controlled operating reference for SWD OS v1.0. It defines required operational steps, governance controls, and recovery procedures for local-first operations.

### 0.2 Scope

In scope:

- Vault CLI operations.
- War Room dashboard operations.
- Integrity, backup, restore, and anomaly workflows.

Out of scope:

- Deferred connectors and cloud integrations.
- Non-v1.0 architecture changes.

## 1. System Overview

### 1.1 Purpose

SWD OS is a local-first governance operating system designed to:

- Maintain an append-only audit ledger.
- Ingest structured knowledge bundles.
- Enforce duplicate controls before insert.
- Preserve integrity via hash chain.
- Provide operator visibility via War Room.

The system is built for deterministic local execution, cloud-independent operations, and audit-grade traceability.

## 2. Architecture Overview

```text
WSL (Linux)
|
|-- vault/cli              -> Ingestion engine
|-- vault/dashboard        -> War Room (Next.js)
|-- Vault DB (SQLite)      -> Append-only hash-chained ledger
|-- Encrypted backups      -> Rotated and restore-tested
`-- Local ingestion bundles
```

## 3. Core Components

### 3.1 Vault CLI

Responsibilities:

- Bundle ingestion.
- Duplicate detection (bundle/file/record).
- Provenance tagging.
- Hash-chain maintenance.
- Backup and restore workflows.

Operational properties:

- Append-only event model.
- Monotonic recency by event `id`.
- Counter-contract warnings for invalid ingest metrics.
- No direct DB mutation outside `swd-vault`.

### 3.2 War Room Dashboard

Provides:

- Vault health.
- Latest ingest coverage and anomaly badges.
- Duplicate-only run detection.
- Provenance visibility.
- Timeline forensic drilldown.

Runtime:

- Node `18.19.1` via `.nvmrc`.
- `better-sqlite3` ABI aligned to pinned Node.

## 4. Operating the System

### 4.1 Start Dashboard

```bash
cd vault/dashboard
source "$HOME/.nvm/nvm.sh"
nvm use
npm run dev
```

Production build/run:

```bash
npm run build
npm start
```

### 4.2 Ingest Bundle

Notion export (MD/CSV/HTML):

```bash
./swd-vault ingest notion --bundle <bundle-name> --include-html
```

Re-run safety behavior:

- Duplicate content is skipped.
- No-op ingest is suppressed.
- Event count remains unchanged when input is identical.

### 4.3 Verify Integrity

```bash
./swd-vault verify chain
```

Expected result:

- Chain OK.
- No hash mismatch.
- No unsealed-row violation.

If verification fails:

1. Stop dashboard and ingestion activity.
2. Restore from last valid encrypted backup.
3. Re-run `./swd-vault verify chain`.
4. Resume operations only after pass.

### 4.4 Backup and Restore Drill

Encrypted rotated backup:

```bash
export VAULT_BACKUP_PASSPHRASE="<long-random-passphrase>"
./swd-vault backup --encrypt --dest ~/swd-backups/vault --rotate
```

Restore drill (non-destructive):

```bash
./swd-vault restore --from ~/swd-backups/vault/<snapshot>.sqlite.gpg --dry-run
./swd-vault verify chain
```

## 5. Duplicate Control Model

Three-layer duplicate protection:

1. Bundle SHA.
2. File fingerprint.
3. Record fingerprint.

Duplicate-only runs:

- `inserted = 0`
- `skipped > 0`
- no new ingest-summary event.

## 6. Provenance Model

Each ingest summary includes:

- `run_profile`
- `cli_version`
- `host_fingerprint`
- `csv_rows_scanned`

Provenance visibility:

- War Room Status (latest and last-10 ingests).
- Timeline expandable details for forensic event types.

## 7. Laptop Safety Controls

Baseline controls that must remain enabled:

- SQLite WAL mode.
- SQLite synchronous `NORMAL`.
- Local DB path under WSL filesystem (not `/mnt/c`).
- HTML ingest size cap and excerpt truncation.
- Backup retention rotation.
- Restore drills with verification.

## 8. Anomaly Handling

### 8.1 Counter-Contract Warning

If counters are inconsistent (for example `scanned < inserted + skipped`):

- a warning event is emitted.
- ingest continues in non-blocking mode.
- operator investigation is required before next scheduled run.

### 8.2 Coverage Mismatch

Examples:

- scanned data with no inserted/skipped values.
- format-scanned counts with missing format results.

Action:

1. Inspect latest `ingest_summary.details_json`.
2. Validate parser flags for the bundle format.
3. Re-run on a controlled sample.

## 9. Forensic Operations

Use Timeline details to trace:

- run profile.
- CLI version.
- host fingerprint.
- backup/restore verification outcomes.

Authoritative event recency is event `id`, not wall-clock ordering.

## 10. Maintenance Schedule

Weekly:

- `./swd-vault verify chain`
- `./swd-vault restore --from <snapshot> --dry-run`

Monthly:

- review vault size trend and duplicate ratios.
- review recent `system`/`security` warnings.
- confirm backup rotation outputs.

Before CLI upgrade:

1. Capture current schema/build IDs.
2. Run chain verify.
3. Create encrypted backup.
4. Apply upgrade.
5. Ingest a small validation bundle.
6. Verify chain again.
7. Log decision in `docs/DECISIONS.md`.

## 11. Upgrade Procedure

```text
Backup -> Verify -> Upgrade -> Test Ingest -> Verify -> Decision Log
```

Do not skip pre-upgrade backup.

## 12. Freeze Baseline (v1.0)

Frozen invariants:

- hash chain algorithm and canonicalization.
- additive-only schema compatibility.
- duplicate semantics (bundle/file/record).
- ingest provenance structure.
- backup/restore verification contract.

Any freeze amendment must be documented in `docs/DECISIONS.md`.

## 13. Emergency Recovery

If corruption is suspected:

1. Stop dashboard process.
2. Restore latest encrypted backup to explicit target path.
3. Run `./swd-vault verify chain`.
4. Confirm schema/build markers.
5. Resume only after verification pass.

## 14. Governance Principle

SWD OS v1.0 is:

- local-first.
- deterministic.
- append-only.
- audit-traceable.
- cloud-independent for current scope.

Deferred connector planning lives only in `docs/ROADMAP_CONNECTORS.md`.

## 15. Environment Requirements

- WSL Linux environment.
- Node `18.19.1`.
- Python 3.x.
- Free disk space >= 2 GB.
- Encrypted local backup storage.

## 16. PDF Export

Simple export:

```bash
npx markdown-pdf docs/SWD_OS_OPERATOR_MANUAL.md
```

Audit-grade export:

```bash
pandoc docs/SWD_OS_OPERATOR_MANUAL.md \
  --from markdown \
  --pdf-engine=xelatex \
  --toc \
  --number-sections \
  -V geometry:margin=1in \
  -o SWD_OS_OPERATOR_MANUAL_v1.0.pdf
```

## 17. Controlled Distribution

Controlled copy recipients:

- SWD CTO
- SWD Operations Lead
- Designated Platform Operator

Distribution rule:

- This document is distributed as a controlled PDF artifact.
- Uncontrolled copies must be marked: "UNCONTROLLED WHEN PRINTED".

## 18. Revision History

| Version | Date       | Author | Change Summary |
| --- | --- | --- | --- |
| v1.0 | 2026-02-20 | Forge | Initial local-first operator baseline established. |
| v1.0.1 | 2026-02-20 | Forge | Added document control, controlled distribution, revision history, and sign-off sections. |

## 19. Approval and Sign-Off

Prepared by:

- Name: ____________________
- Role: ____________________
- Date: ____________________
- Signature: ____________________

Reviewed by:

- Name: ____________________
- Role: ____________________
- Date: ____________________
- Signature: ____________________

Approved by:

- Name: ____________________
- Role: CTO
- Date: ____________________
- Signature: ____________________

## 20. Controlled Copy Notice

- Reference source of truth: `docs/SWD_OS_OPERATOR_MANUAL.md`
- Runtime control markers: `VAULT_SCHEMA_VERSION`, `VAULT_BUILD_ID`
- Any amendment requires a corresponding entry in `docs/DECISIONS.md`.
