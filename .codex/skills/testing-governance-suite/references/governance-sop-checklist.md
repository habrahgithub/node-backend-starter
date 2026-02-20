# Governance and SOP Checklist

## Governance Controls

1. Security gates are executed (secret scanning, config validation).
2. Policy checks are enforced (least privilege, release policy constraints).
3. License enforcement checks run when applicable.
4. Audit log continuity is intact (hash chain or continuity contract, where used).

## SOP Order Compliance

Required flow:

1. Lint/static
2. Sanity
3. Unit
4. Integration
5. System/E2E
6. Regression
7. Stress/load (if approved)
8. Governance/SOP/Environment/State

Any order violation must be flagged.

## Environment Consistency

1. Required env vars are present.
2. No placeholder secrets remain.
3. Correct endpoints/domains configured.
4. Migration status is applied/compatible.

## State Consistency

1. Idempotent operations remain idempotent under retries.
2. State machines reject invalid transitions.
3. Retry behavior does not duplicate money, claims, or generated files.
