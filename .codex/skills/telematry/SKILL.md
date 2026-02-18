---
name: telematry
description: Collect and interpret runtime telemetry for task execution, including logs, metrics, traces, and checkup outputs. Use when the user asks for operational visibility, error-rate analysis, performance trends, or post-run diagnostics.
---

# Telematry

## Workflow

1. Identify target project, environment, and time window.
2. Capture key signals: logs, build/test outputs, latency, error rates.
3. Separate signal from noise by grouping recurring failures.
4. Correlate failures with recent code or config changes.
5. Summarize findings with concrete next actions.

## Signal Priorities

- Deployment/build failures.
- Runtime exceptions and authentication failures.
- Error spikes and saturation signals.
- Regression markers from checkup and test suites.

## Output Rules

- Report top incidents first with impacted path/service.
- Include one reproducible command or source path per finding.
- Mark unknowns explicitly when evidence is incomplete.

## Reference

- `references/telematry-checklist.md`
