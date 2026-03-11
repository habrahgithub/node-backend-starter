# Policy Model

## Policy Schema
Each governance policy is represented as:
- `policy_id`
- `description`
- `evaluation_target`
- `severity`
- `threshold`
- `enabled`

## Default Policies
- `node_heartbeat_threshold`
- `service_health_exposure`
- `repo_stale_branches_limit`
- `dependency_risk_limit`
- `agent_activity_window`

## Configurable Thresholds
Environment-based threshold controls:
- `GOVERNANCE_HEARTBEAT_MAX_OFFLINE_NODES`
- `GOVERNANCE_HEARTBEAT_MAX_DEGRADED_NODES`
- `GOVERNANCE_SERVICE_MAX_DEGRADED_SERVICES`
- `GOVERNANCE_REPO_MAX_STALE_REPOSITORIES`
- `GOVERNANCE_DEPENDENCY_MAX_HIGH_RISK`
- `GOVERNANCE_AGENT_MAX_STALLED_AGENTS`

Optional file override:
- `GOVERNANCE_POLICY_FILE_PATH`

File format supports either:
- array of policies
- `{ "policies": [ ... ] }`

## Evaluation Status
Policy evaluation status values:
- `pass`
- `violation`
- `needs_review`

Every evaluated policy includes:
- threshold context
- evidence rows
- confidence score
- advisory remediation guidance
