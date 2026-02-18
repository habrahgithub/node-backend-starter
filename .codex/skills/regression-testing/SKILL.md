---
name: regression-testing
description: Detect behavior regressions after code changes by re-running critical scenarios and comparing outcomes. Use when the user asks for regression checks, release confidence checks, or validation after bug fixes.
---

# Regression Testing

## Workflow

1. Identify critical user journeys and previous bug hotspots.
2. Run baseline checks before applying risky fixes when feasible.
3. Run targeted regression suite for affected features.
4. Run broader regression suite before release handoff.
5. Compare before/after outcomes and flag behavior drift.

## Scope Guidance

- Prioritize auth, payments, data writes, and integration boundaries.
- Include previously fixed bugs in repeated checks.
- Expand only when targeted checks reveal instability.

## Output Rules

- List scenarios as pass/fail.
- Link failures to commit or file changes where possible.
- Call out any untested regression risk.

## Reference

- `references/regression-matrix.md`
