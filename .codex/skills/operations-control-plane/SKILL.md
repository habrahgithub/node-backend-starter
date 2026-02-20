---
name: operations-control-plane
description: Execute a governance-grade operations control workflow across SWD projects with deterministic context gathering, housekeeping, telemetry triage, warden logging, prioritization, remediation loops, and optional release gates.
---

# Operations Control Plane

Use this skill when the user asks for housekeeping, cleanup, audits, readiness checks, operational reporting, or cross-project maintenance.

## Purpose

Provide one consolidated execution and maintenance workflow across SWD projects, preserving release readiness, audit traceability, and repository discipline.

## Deterministic Execution Order

1. Gather execution context and current repo status.
2. Run housekeeping sweep.
3. Collect telemetry and operational signals.
4. Append Warden execution log.
5. Prioritize by Impact/Risk/Effort.
6. Run remediation loop and publish before/after readiness.

Do not reorder steps.

## Step Contracts

### 1) Gather Execution Context

Required snapshot fields:

1. Branch
2. Dirty files
3. Untracked artifacts
4. Last commit
5. Active feature toggles
6. Environment (dev/staging/prod)

If repo is dirty, mark advisory unless blocking.

### 2) Housekeeping Sweep

Must include:

1. Artifact sweep and classification (`persistent`, `temporary`, `noise`)
2. Ignore-discipline verification (`.gitignore`, generated outputs, secrets)

Blocking rules:

1. Tracked noisy artifacts -> Blocker
2. Secret or `.env` exposure -> Critical Blocker

### 3) Telemetry and Operational Signals

Parse only relevant outputs:

1. Test logs (Playwright/golden packs)
2. Build/lint/typecheck output
3. CI logs when available

Report only:

1. Blockers
2. Production-impact warnings
3. Advisories
4. Clean checks

Do not include passing/noisy logs.

### 4) Warden Execution Log

Write append-only entries to:

`ops/logs/YYYY-MM.md`

Never overwrite prior entries.

### 5) Prioritization

Apply deterministic matrix:

1. Impact: payroll correctness/licensing integrity high; cosmetic UI low
2. Risk: compliance/data-loss high; visual inconsistency low
3. Effort: `<1h` low, `1-4h` medium, `>4h` high

Output order:

1. NOW (release blockers)
2. NEXT (high impact, non-blocking)
3. LATER (optimization)

### 6) Remediation Loop

After fixes:

1. Re-run sweep
2. Re-run golden/tests
3. Re-run telemetry
4. Publish before/after and final status (`GREEN`, `YELLOW`, `RED`)

## Capabilities

1. Housekeeping and clutter control
2. Storage discipline for generated outputs
3. Artifact governance classification
4. Telemetry triage focused on execution risk
5. Warden-grade audit logging
6. Impact/Risk/Effort prioritization
7. Multi-project system sweep mode

## Modes

1. `--mode system`:
   - Scan extension, payment gateway, marketing pipeline, and golden tests.
   - Return one unified readiness report.
2. `--release-check`:
   - Enforce zero blockers, 100% golden pass, no tracked artifacts, no secret exposure, version/changelog readiness checks.

## Output Rules

Must include:

1. Before/After state
2. Evidence file paths
3. Blockers section
4. Advisory section
5. Ordered NOW/NEXT/LATER actions
6. Final status color (`GREEN`, `YELLOW`, `RED`)

No fluff and no verbose log dumps.

## References

- `references/ops-sweep-template.md`
- `references/priority-triage-matrix.md`
- `references/artifact-governance.md`
