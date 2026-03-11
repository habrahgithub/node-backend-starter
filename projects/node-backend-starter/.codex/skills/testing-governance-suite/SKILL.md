---
name: testing-governance-suite
description: Run comprehensive testing and readiness checks across projects, including lint, sanity, unit, integration, system, regression, stress/load, governance, SOP compliance, environment validation, and state integrity checks. Use when the user asks for broad QA gates, release checks, or end-to-end verification.
---

# Testing Governance Suite

## Scope

Execute a full quality gate from fast local checks to deep reliability/security checks.

## Test Pyramid and Order

1. `Lint and static checks`
2. `Sanity checks`
3. `Unit tests`
4. `Integration tests`
5. `System/end-to-end tests`
6. `Regression checks`
7. `Stress/load checks`
8. `Governance, SOP, environment, and state checks`

## Execution Workflow

1. Identify target project and available scripts (`checkup:*`, `verify`, `test`, `build`).
2. Run fast blockers first (`lint`, `sanity`, `unit`).
3. Run boundary tests (`integration`, `system`, `regression`).
4. Run performance pressure tests (`load/stress`) only on approved targets.
5. Validate governance controls (security gates, policy checks, SOP adherence).
6. Validate environment and state consistency (required env vars, migrations, health, idempotency/state transitions).
7. Summarize pass/fail by layer and highlight release blockers.

## Coverage Definitions

- `Sanity`: startup + health + one critical flow.
- `Unit`: isolated logic with deterministic assertions.
- `Integration`: service/database/dependency contracts.
- `System`: cross-component user-facing flow (often Playwright/API flow).
- `Regression`: re-check previous bug hotspots and critical paths.
- `Stress`: throughput/latency/error behavior under increasing load.
- `Governance`: required checks/scripts/policies are enforced.
- `SOP`: operational runbook steps are executed in required order.
- `Environment`: secrets/config/deploy prerequisites are valid.
- `State`: data/workflow transitions remain consistent and safe.

## Command Strategy

- Prefer project-defined scripts first (`checkup:run`, `checkup:full`, `verify`).
- Fall back to explicit commands only when scripts are missing.
- Keep logs concise; extract decisive failure lines.

## Output Rules

- Report findings by severity and test layer.
- Separate blocker failures from non-blocking warnings.
- Include exact repro command for each failure.

## References

- `references/test-gate-matrix.md`
- `references/governance-sop-checklist.md`
