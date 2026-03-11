---
name: operations-control-plane
description: Coordinate repository operations hygiene, artifact management, telemetry review, execution logging, prioritization, and multi-project sweeps from one control skill. Use when the user asks for housekeeping, cleanup, audits, operational reporting, or cross-project maintenance.
---

# Operations Control Plane

## Scope

Provide one consolidated operations workflow for maintenance and execution control.

## Workflow

1. Gather execution context and current repo status.
2. Run housekeeping sweep (artifacts, ignore rules, stale outputs).
3. Collect telemetry and summarize operational signals.
4. Record decisions/outcomes in a concise execution log.
5. Prioritize outstanding issues by impact/risk/effort.
6. Re-run checkups after remediation and publish final status.

## Capabilities

- `Housekeeping`: remove clutter and keep repo clean.
- `Storage discipline`: avoid committing generated/noisy artifacts.
- `Artifact governance`: classify persistent vs temporary outputs.
- `Telemetry`: parse logs/checkup outputs for real failures.
- `Warden logging`: keep auditable execution trace.
- `Prioritization`: order fixes and tasks for release readiness.
- `System sweep`: perform multi-project readiness pass.

## Output Rules

- Provide before/after status and evidence paths.
- Distinguish blockers from advisory improvements.
- Keep recommendations ordered: Now, Next, Later.

## References

- `references/ops-sweep-template.md`
- `references/priority-triage-matrix.md`
