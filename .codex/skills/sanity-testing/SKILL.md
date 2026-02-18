---
name: sanity-testing
description: Execute fast sanity/smoke checks to confirm core system health after changes or deployment. Use when the user asks for smoke tests, sanity checks, or quick confidence before deeper testing.
---

# Sanity Testing

## Workflow

1. Build and start target service.
2. Verify health endpoint or startup readiness.
3. Exercise one core happy-path action.
4. Validate one auth-protected path when applicable.
5. Stop on first blocker and report exact failure point.

## Typical Checks

- App boots without runtime errors.
- Health endpoint returns success.
- Critical route renders or API responds.
- Required env vars are present.

## Output Rules

- Report pass/fail per check in order.
- Include command used and short result.
- Escalate blockers before running deeper suites.

## Reference

- `references/smoke-checklist.md`
