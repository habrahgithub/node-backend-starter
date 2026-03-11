# Incident Playbooks

## Playbook Contract
Each playbook includes:
- `incident_id`
- `playbook_title`
- `recommended_steps`
- `prerequisites`
- `rollback_checks`
- `approval_required`
- `confidence`
- `evidence`

## Playbook Types
- Recurring Diagnostics Failure Playbook
- Warning Cluster Stabilization Playbook
- Service Stability Drift Playbook
- Reliability Watch Playbook

## Usage Guidance
- Use incident severity and confidence to prioritize.
- Validate prerequisites before any operator-run step.
- Keep rollback checks visible during execution planning.
- Record lessons in the local learning ledger after resolution.

## Governance Rules
- Playbooks are advisory artifacts.
- Any execution remains operator-approved.
- No autonomous remediation is enabled.
