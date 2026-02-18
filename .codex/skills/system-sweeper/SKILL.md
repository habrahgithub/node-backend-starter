---
name: system-sweeper
description: Perform broad system-wide sweeps that combine hygiene, checks, and readiness validation across multiple projects. Use when the user asks for full project sweeps, release readiness passes, or periodic maintenance audits.
---

# System Sweeper

## Workflow

1. Run multi-project checkup baseline.
2. Flag failing projects and map failure classes (lint, test, build, config).
3. Execute targeted fixes for highest-priority blockers.
4. Re-run checkup to confirm closure.
5. Deliver final readiness summary with residual risks.

## Sweep Coverage

- Project script coverage (`lint`, `test`, `build`, `checkup:*`).
- Config hygiene (eslint ignores, env assumptions, generated artifact policy).
- Security-sensitive workflow checks.
- Release readiness blockers and deferred items.

## Output Rules

- Provide before/after status.
- Include exact commands used for verification.
- Separate fixed blockers from remaining risks.

## Reference

- `references/sweep-template.md`
