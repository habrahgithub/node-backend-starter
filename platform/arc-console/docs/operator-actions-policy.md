# Operator Actions Policy

## Current State
Operator control actions are defined but not enabled.

Policy endpoint:
- `GET /api/operator/actions`

Returns:
- `enabled: false`
- action catalog marked `defined_not_enabled`
- safeguards and approval requirements

## Action Model (Definition Only)
Candidate actions:
- `service_restart`
- `repo_sync`
- `artifact_reclassify`

All require:
- Prime approval
- rollback plan
- audit logging

## Approval Requirements
Before enabling any action:
1. Security review complete
2. Audit event coverage verified
3. Rollback path documented and tested
4. Explicit Prime authorization recorded

## Logging Requirements
Every future action request must produce:
- request id
- actor id
- requested action
- approval reference
- execution outcome
- rollback event linkage (if triggered)

## Rollback Expectations
Each action must define:
- rollback trigger conditions
- rollback command path
- post-rollback verification checks

## Guardrails
- No action may mutate external repos/services in this phase.
- Visibility does not imply execution authority.
