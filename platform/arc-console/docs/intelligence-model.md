# Intelligence Model

## Core Principles
- Evidence-first: every finding includes evidence fields.
- Confidence-aware: each item includes `confidence_score`.
- Advisory-only: no autonomous control actions.
- Operator-gated: recommended actions require explicit operator approval.

## Service Trend Model
Output fields:
- `service`
- `health_trend`
- `failure_count`
- `stability_score`
- `confidence_score`
- `evidence`

Heuristics:
- operational status + failure events + warning count -> trend and stability

## Repository Drift Model
Output fields:
- `repository`
- `drift_type`
- `risk_level`
- `evidence`
- `confidence_score`

Drift categories:
- governance state drift
- governance policy drift
- stale branch drift
- dependency divergence

## Dependency Risk Model
Output fields:
- `package`
- `current_version`
- `recommended_version`
- `risk_score`
- `confidence_score`
- `evidence`

Heuristics:
- wildcard/link/workspace versions increase risk
- major-zero versions increase risk
- dirty/unknown repository state adds risk penalty

## Agent Activity Model
Output fields:
- `agent`
- `tasks_run`
- `success_rate`
- `activity_trend`
- `confidence_score`
- `evidence`

Heuristics:
- no recent tasks for active agent -> stalled trend
- low success rate -> unstable trend

## Platform Insight Aggregation
Output fields:
- `top_risks`
- `recommended_actions`
- `confidence_scores`
- `evidence_links`

Aggregation combines all domain findings into a ranked risk list and operator-gated recommendations.
