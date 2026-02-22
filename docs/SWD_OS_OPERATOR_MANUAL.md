# SWD OS - UI/UX Operator Manual

Document Status: Controlled
Version: v1.1 (UI/UX Operations Edition)
Schema Version: `{{VAULT_SCHEMA_VERSION}}`
Build ID: `{{VAULT_BUILD_ID}}`
Node Runtime (Dashboard): `20.11.1`
Last Updated: 2026-02-20
Document ID: `SWD-OS-OPS-MANUAL-V1`
Classification: Internal - Controlled
Owner: SWD Operations
Approved By: CTO
Effective Date: 2026-02-20
Review Cycle: Quarterly

## 0. Purpose and Scope

This document is the operator-facing UI/UX manual for SWD OS.
It explains how to run operations from the War Room interface, how to read system signals, and how to act on alerts without deep technical digging.

In scope:

- War Room navigation and behavior.
- Operator workflows (daily operations, triage, run control, ingest control).
- UX semantics for statuses, severity, and provenance.

Out of scope:

- Internal implementation details of parsers and storage engines.
- Future connectors and cloud features.

## 1. Product Experience Intent

SWD OS is designed as a local-first operations cockpit.

UX goals:

- Fast orientation: operator understands system state in under 30 seconds.
- Low-friction control: safe actions are reachable in 1-2 clicks.
- Forensic depth on demand: details are hidden by default, expandable when needed.
- Deterministic trust: what the UI shows must match the append-only vault state.

## 2. Operator Roles

Primary role:

- Platform Operator: runs ingestion, monitors health, responds to blockers.

Secondary roles:

- Reviewer/Auditor: validates integrity, backup posture, and run provenance.
- Product Owner: checks operational readiness and recurring failure trends.

## 3. War Room Information Architecture

Primary routes:

- `/` Status: command center summary.
- `/timeline`: forensic chronological event view.
- `/runs`: execution history and evidence links.
- `/decisions`: decision and ops-sweep stream.
- `/blockers`: active blocker surface grouped by fingerprint.
- `/projects`: per-project health cards.
- `/run-profiles`: controlled trigger page for fast/standard/full profiles.
- `/events/[id]`: event-level drilldown.

Navigation behavior:

- Status and Timeline are always first-class entry points.
- Action pages (`/run-profiles`) are separated from read-only monitoring pages.
- Deep details live in `/events/[id]` or collapsible sections to avoid clutter.

## 4. UX Semantics (Visual Language)

### 4.1 Release Color

- `GREEN`: no blockers in policy window.
- `YELLOW`: warnings present, no blockers.
- `RED`: blocker present or integrity-critical issue.

### 4.2 Severity Scale

- `info`: normal operational records.
- `notice`: noteworthy but expected deviation (for example duplicate-only ingest).
- `warning`: operator attention required, non-blocking.
- `critical`: release-impacting issue.
- `fatal`: execution failed in a way that may invalidate current run.

### 4.3 Badge Meaning

- `duplicate-only`: ingest scanned data but inserted none (expected on rerun).
- `counter-regression`: ingest metrics inconsistent; investigate parser output.
- `html-path-mismatch`: html counters indicate partial path mismatch.

## 5. Screen-by-Screen Operating Guide

## 5.1 Status (`/`)

Purpose:

- One-screen health and readiness assessment.

Operator reads in this order:

1. Release color (GREEN/YELLOW/RED).
2. Integrity widget (Chain OK or broken).
3. Backup freshness.
4. Recent critical events.
5. Format Coverage (latest ingest).
6. Last 10 ingests trend.

Operator actions from this page:

- If `RED`: move to `/blockers`, then `/timeline`.
- If backup stale: execute backup flow and confirm recovery drill.
- If coverage anomaly appears: open latest ingest summary event.

## 5.2 Timeline (`/timeline`)

Purpose:

- Forensic history with filters.

Use cases:

- Determine when a failure started.
- Validate if a warning is recurring.
- Correlate run failures with ingest or config changes.

Interaction rules:

- Filter by project, type, severity before scrolling.
- Expand only relevant event rows.
- Read provenance only for high-value event types (`ingest_summary`, `backup`, `restore`).

## 5.3 Runs (`/runs`)

Purpose:

- Inspect command execution outcomes.

Read each row as:

- command -> exit code -> duration -> evidence path.

Operator decision:

- non-zero exit + repeated fingerprint = recurring failure candidate.
- isolated non-zero + no recurrence = transient incident candidate.

## 5.4 Decisions (`/decisions`)

Purpose:

- Maintain operational continuity and intent.

Expected tags:

- `now`, `next`, `later` in details payload.

Operator behavior:

- record major direction shifts and freeze amendments.
- do not use this view for verbose logs; keep entries decision-grade.

## 5.5 Blockers (`/blockers`)

Purpose:

- Fast triage queue.

Expected grouping:

- fingerprint-based grouping to reduce noise.

Operator flow:

1. open highest recurrence blocker.
2. inspect latest evidence path.
3. confirm whether issue is new or known.
4. execute remediation or assign action.

## 5.6 Projects (`/projects`)

Purpose:

- Portfolio-level readiness by project.

Card interpretation:

- last activity time.
- blocker count.
- latest run status.

Use when deciding what to run next (`fast` vs `standard` vs `full`).

## 5.7 Run Profiles (`/run-profiles`)

Purpose:

- Safe control plane execution.

Guardrails:

- no arbitrary command input in UI.
- only configured profiles are triggerable.
- localhost + token hardening rules apply.

UX expectation:

- button click -> running state -> summary result -> link to run evidence.

## 6. Core Operator Journeys

### 6.1 Start-of-Day Health Check (2-5 min)

1. Open `/` Status.
2. Confirm chain status is OK.
3. Confirm backup freshness is within policy.
4. Check Recent Critical Events.
5. Review latest ingest coverage and anomaly badges.
6. If stable, run `fast` profile from `/run-profiles`.

Success criteria:

- no unresolved critical issues.
- no stale backup condition.
- no unexplained ingest anomaly.

### 6.2 Ingest Snapshot Validation

1. Trigger ingest workflow (CLI or controlled profile).
2. Open `/` and confirm latest ingest appears.
3. Check md/csv/html scanned vs inserted vs skipped.
4. If duplicate-only badge appears on rerun, treat as expected.
5. Open event details and verify provenance fields.

Success criteria:

- counters consistent.
- provenance present.
- chain remains healthy after ingest.

### 6.3 Blocker Triage Workflow

1. Open `/blockers`.
2. Prioritize by severity + recurrence count.
3. Open linked run evidence.
4. Verify scope in `/timeline`.
5. Apply fix and rerun minimal profile.
6. Record decision in `/decisions` when policy/flow changes.

Success criteria:

- blocker no longer appears in latest run window.
- no new critical regression introduced.

### 6.4 Release Readiness Check

1. Run standard/full profile.
2. Validate `/runs` and `/blockers` are clean.
3. Confirm governance checks (integrity + backup + env contract).
4. Confirm release color on `/` is GREEN.

Success criteria:

- zero active blockers.
- governance gate clear.
- evidence links available for audit.

## 7. UX Behavior Standards

Interaction standards:

- Keep list views scannable; details are progressive disclosure.
- Prefer badges/tags over long status text blocks.
- Show timestamps in consistent local format.
- Never hide critical state behind multiple clicks.

Copy standards:

- Use action-oriented labels (`Run Fast`, `Verify Chain`, `Backup Now`).
- Avoid ambiguous language (`maybe`, `probably`) in operator-facing status.
- Keep summaries one-line and evidence-driven.

Accessibility baseline:

- keyboard reachable primary actions.
- visible focus indicators.
- color is not the only severity signal (badges/text labels required).

## 8. Failure-State UX

When integrity fails:

- Status shows explicit broken-chain state.
- Operator path is deterministic: stop writes -> restore -> verify -> resume.

When env contract fails:

- show missing variable by exact name.
- avoid generic "configuration error" copy.

When duplicate-only ingest occurs:

- show as neutral/notice state, not warning.

When counters regress:

- show warning badge with direct link to latest ingest summary details.

## 9. Technical Appendix (Quick Commands)

Use only when UI action is unavailable or for controlled recovery.

Start dashboard:

```bash
cd vault/dashboard
source "$HOME/.nvm/nvm.sh"
nvm use
npm run dev
```

Verify integrity:

```bash
./swd-vault verify chain
```

Backup with rotation:

```bash
export VAULT_BACKUP_PASSPHRASE="<long-random-passphrase>"
./swd-vault backup --encrypt --dest ~/swd-backups/vault --rotate
```

Restore dry-run:

```bash
./swd-vault restore --from ~/swd-backups/vault/<snapshot>.sqlite.gpg --dry-run
```

Notion ingest example:

```bash
./swd-vault ingest notion --bundle <bundle-name> --include-html
```

## 10. Controlled Distribution and Revision

Controlled recipients:

- SWD CTO
- SWD Operations Lead
- Designated Platform Operator

Distribution rule:

- This document is distributed as a controlled PDF artifact.
- Uncontrolled copies must be marked: `UNCONTROLLED WHEN PRINTED`.

Revision history:

| Version | Date       | Author | Change Summary |
| --- | --- | --- | --- |
| v1.0 | 2026-02-20 | Forge | Initial operator baseline. |
| v1.0.1 | 2026-02-20 | Forge | Added control/distribution/sign-off structure. |
| v1.1 | 2026-02-20 | Forge | Reframed manual to UI/UX-first operator workflows and screen playbooks. |

Approval and sign-off:

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
