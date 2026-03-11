# Operator Workflows

## Workflow Catalog

### `system-scan`
- Purpose: refresh registry and platform health status
- Prerequisites: authenticated operator, readable registry inputs
- Output: inventory counts, warnings, overall platform health

### `repo-audit`
- Purpose: run governance-grade repository signal scan
- Prerequisites: authenticated operator, repo inventory available
- Output: governance score summary, stale branch summary, dependency risk summary

### `agent-health-check`
- Purpose: verify managed agent visibility and pipeline-stage status
- Prerequisites: authenticated operator, agent inventory available
- Output: total/active/supported agent counts

### `platform-health-check`
- Purpose: aggregate service metrics with platform health posture
- Prerequisites: authenticated operator, service inventory available
- Output: total services, degraded count, overall health

## Execution Contract
- Endpoint: `POST /api/workflows/run`
- Required body:
  - `workflowId`
  - `confirmation` (must match `ARC_WORKFLOW_CONFIRMATION_TOKEN`)

## Failure/Block Conditions
- Undefined workflow id -> `not_found`
- Missing or invalid confirmation token -> `blocked`
- Missing prerequisites -> `blocked`

## Audit Expectations
Every run attempt logs:
- operator
- workflow id (target)
- result (`completed|blocked|not_found`)
- duration

No workflow can mutate external repos/services in Phase 6.
