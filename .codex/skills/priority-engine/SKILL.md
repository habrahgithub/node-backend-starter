---
name: priority-engine
description: Rank tasks and fixes by impact, risk, urgency, and effort to drive clear execution order. Use when the user asks what to do first, how to prioritize backlog, or which issues block release readiness.
---

# Priority Engine

## Workflow

1. List candidate tasks/issues with concrete scope.
2. Score each item using impact, risk, urgency, and effort.
3. Identify blockers and dependencies.
4. Produce ordered execution plan (Now, Next, Later).
5. Re-rank after new failures or scope changes.

## Scoring Model

- Impact: user/business effect if unresolved.
- Risk: security, correctness, operational hazard.
- Urgency: time sensitivity (release, incident, SLA).
- Effort: implementation and verification cost.

## Output Rules

- Show top priorities with one-line rationale each.
- Separate hard blockers from quality improvements.
- Include defer candidates with explicit reason.

## Reference

- `references/prioritization-matrix.md`
