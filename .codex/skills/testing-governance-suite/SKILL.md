---
name: testing-governance-suite
description: Execute a deterministic testing and governance quality gate across SWD projects, from lint through system/regression and governance/SOP/environment/state checks, producing an auditable release verdict.
---

# Testing Governance Suite

Use this skill when the user asks for broad QA gates, release checks, end-to-end verification, or audit-ready test governance.

## Purpose

Execute a full quality gate from fast local checks to deep reliability/security checks, then return a release-ready verdict with evidence.

## Test Pyramid and Strict Execution Order

Run layers in this exact order and stop early on blockers unless the user explicitly says `continue`:

1. `Lint and static checks`
2. `Sanity checks`
3. `Unit tests`
4. `Integration tests`
5. `System/end-to-end tests`
6. `Regression checks`
7. `Stress/load checks` (approved targets only)
8. `Governance, SOP, environment, and state checks`

## Execution Workflow (Deterministic)

### 1) Identify Target + Discover Scripts

Required inputs:

1. Target project name/path
2. Execution mode (`fast`, `standard`, `full`)
3. Stress/load approval (`approved`, `not-approved`)

Discovery order:

1. `checkup:*`
2. `verify`
3. `test`
4. `build`

If scripts are missing, use layer-specific fallback commands and document them.

### 2) Run Fast Blockers First

1. Lint/static
2. Sanity (`startup + health + one critical flow`)

For failures, provide:

1. PASS/FAIL
2. One decisive failure excerpt
3. Exact repro command

### 3) Boundary Tests

1. Unit:
   - No network
   - Deterministic assertions
   - Mock time/uuid when required
2. Integration:
   - Real service contracts (DB/API)
   - Migration compatibility
   - Idempotency behavior where applicable
3. System/E2E:
   - Cross-component user-visible flow
   - Extension flow should include SIF generation and golden verification
4. Regression:
   - Bug hotspot reruns
   - Include critical risks (WPS/SCR totals, license claim/redeem, fail-closed behavior)

### 4) Stress/Load (Approved Only)

1. If not approved -> `SKIPPED (Not Approved)`
2. If approved -> report throughput, p95 latency, error rate, and failure mode behavior

### 5) Governance + SOP + Environment + State

Validate:

1. Security gates and policy checks
2. SOP order compliance
3. Environment completeness (required vars, endpoints, migration readiness)
4. State consistency (idempotency, valid transitions, retry safety)

### 6) Final Release Verdict

Always publish:

1. Layered PASS/FAIL table
2. Blockers, warnings, skipped
3. Evidence paths
4. Final verdict: `Release Status: GREEN | YELLOW | RED`

## Coverage Definitions

1. `Sanity`: startup + health + one critical flow.
2. `Unit`: isolated deterministic logic.
3. `Integration`: DB/service/dependency contracts.
4. `System`: full user-visible cross-component flow.
5. `Regression`: known bug hotspots + critical paths.
6. `Stress`: performance under increasing load.
7. `Governance`: controls/scripts/policies enforced.
8. `SOP`: runbook order executed.
9. `Environment`: secrets/config/deploy prerequisites valid.
10. `State`: transitions safe and consistent under retries.

## Command Strategy

1. Use project scripts first:
   - `npm run checkup:run`
   - `npm run checkup:full`
   - `npm run verify`
   - `npm test`
   - `npm run build`
2. Use fallback commands only when scripts are missing and document why.
3. Keep logs concise and surface decisive lines only.

## Output Rules

Must include:

1. Results by layer:
   - Lint/static
   - Sanity
   - Unit
   - Integration
   - System/E2E
   - Regression
   - Stress/load
   - Governance/SOP/Env/State
2. Severity grouping:
   - Blockers (stop release)
   - Warnings (non-blocking)
   - Skipped (not approved/not applicable)
3. Evidence paths:
   - logs/reports
   - Playwright screenshots/videos when applicable
   - artifact outputs with git-ignore confirmation
4. Final verdict format:
   - `Release Status: GREEN | YELLOW | RED`
   - `Reason: <one line>`

## Modes

1. `fast`: lint + sanity + unit
2. `standard`: fast + integration + system + regression
3. `full`: standard + governance/env/state (stress only if approved)

## DocSmith Golden Pack Gate

For extension system/E2E, include:

1. Generate SIF from golden inputs
2. Normalize timestamp fields or use deterministic clock
3. Compare against expected outputs
4. Store evidence video + generated SIF under artifacts (and ensure ignored from git)

## References

- `references/test-gate-matrix.md`
- `references/governance-sop-checklist.md`
- `references/script-discovery.md`
- `references/docsmith-golden-pack-gate.md`
