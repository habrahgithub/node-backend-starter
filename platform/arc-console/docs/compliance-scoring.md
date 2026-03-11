# Compliance Scoring

## Objective
Compute governance posture as a score that reflects policy violations, needs-review findings, and drift severity.

## Score Outputs
- `overall_score`
- `node_score`
- `service_score`
- `repo_score`
- `trend`

## Scoring Inputs
- policy evaluation summary (`/api/governance/evaluate`)
- drift summary (`/api/governance/drift`)

## Trend Tracking
Compliance history is stored locally at:
- `GOVERNANCE_COMPLIANCE_HISTORY_PATH`

Each record captures:
- timestamp
- overall and domain scores
- derived trend (`up`, `down`, `stable`, `unknown`)

## Interpretation Guidance
- `>= 85`: healthy governance posture
- `70 - 84`: warning posture; remediation planning recommended
- `< 70`: elevated governance risk; operator-approved remediation recommended

## Safety Notes
- Scores are advisory and do not trigger enforcement actions.
- Low-confidence or partial-evaluation states should be treated as needs-review.
- Recommended actions remain approval-required by policy.
