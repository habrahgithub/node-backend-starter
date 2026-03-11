# ARC Console API Contract

## Base
- Base URL: `http://<host>:<port>`
- Default local: `http://127.0.0.1:4015`
- Content type: `application/json`

## Query Parameters
Common optional parameter on read routes:
- `refresh=true|false`
  - `true` forces a new registry snapshot
  - `false` (default) uses cache (`REGISTRY_CACHE_TTL_MS`)

## Endpoints

### `POST /api/auth/login`
Authenticates local operator credentials and sets session cookie.

Request body:
- `username`
- `password`

Success `200` shape:
- `authenticated: true`
- `username`

Failure `401`:
- `error: "invalid_credentials"`
- `message`

Failure `429`:
- `error: "too_many_attempts"`
- `message`
- `retryAfterSeconds`

### `POST /api/auth/logout`
Clears session cookie.

Success `200` shape:
- `authenticated: false`

### `GET /api/auth/session`
Returns current session status.

Success `200` shape:
- `authenticated: true`
- `username`
- `issuedAt`
- `expiresAt`

Failure `401` shape:
- `authenticated: false`
- `reason`

### `GET /api/system/status`
Returns control-plane identity plus full registry snapshot.

Success `200` shape:
- `console`: `{ name, environment, registrySource, unifiedServer, dashboardEnabled }`
- `generatedAt`: ISO timestamp
- `counts`: `{ services, repositories, agents }`
- `summary`: health seed object
- `warnings`: warning array
- `registry`: `{ generatedAt, source, services[], repositories[], agents[], warnings[], health_status }`

### `GET /api/services`
Returns service registry view.

Success `200` shape:
- `items`: service array

Service item fields:
- `id`, `name`, `domain`, `projectType`, `status`, `lifecycleStatus`
- `runtime`, `owner`, `path`, `priority`
- `executionType`, `executionReadiness`

### `GET /api/services/health`
Returns service-health rollup.

Success `200` shape:
- `total`, `operational`, `degraded`, `details[]`

### `GET /api/repos`
Returns repository inventory rollup.

Success `200` shape:
- `items`: repository array
- `summary`: `{ total, dirty, unknown, clean }`

Repository item fields:
- `id`, `name`, `path`, `relativePath`
- `status` (`clean|dirty|unknown`)
- `repoType` (`monorepo|gitlink|embedded-repo|nested-repo`)
- `dirtyCounts`: `{ modified, deleted, untracked }`

### `GET /api/agents`
Returns agent-state catalog.

Success `200` shape:
- `items`: agent array
- `summary`: `{ total, active, standby }`
- `warnings`: string array

Agent item fields:
- `id`, `name`, `role`, `status`, `currentTask`, `pipelineStage`

### `GET /api/health`
Returns platform health aggregation.

Success `200` shape:
- `overall` (`healthy|warning|critical`)
- `summary`
- `generatedAt`
- `registrySource`
- `serviceAvailability`
- `repositoryActivity`
- `ciCd`
- `agentActivity`
- `systemMetrics`
- `healthSeed`
- `warnings[]`

### `GET /api/governance/summary`
Returns governance widgets payload.

Success `200` shape:
- `generatedAt`
- `priorityDistribution[]`
- `statusDistribution[]`
- `repoBoundaryStatus[]`
- `recoveryBacklogSummary`
- `warningCenter`
- `systemHealthSummary`

### `GET /api/logs`
Returns synthesized control-plane events.

Success `200` shape:
- `items`: event array

Event fields:
- `id`, `source`, `level`, `message`, `at`
- optional: `code`

### `POST /api/integrations/repo-inventory/refresh`
Protected read-only adapter endpoint.

Success `200` shape:
- `refreshedAt`
- `mode: "read_only"`
- `summary`

### `POST /api/integrations/artifacts/refresh`
Protected read-only artifact signal refresh endpoint.

Success `200` shape:
- `refreshedAt`
- `mode: "read_only"`
- `files`

### `GET /api/integrations/agent-state`
Protected read-only adapter for agent-state data.

Success `200` shape:
- `source`
- `count`
- `items`
- optional `error`

### `GET /api/integrations/service-heartbeat`
Protected read-only adapter for service heartbeat data.

Success `200` shape:
- `source`
- `count`
- `items`
- optional `error`

### `GET /api/operator/actions`
Protected policy endpoint for defined (not enabled) operator actions.

Success `200` shape:
- `enabled` (false in this phase)
- `reason`
- `actions[]`
- `safeguards[]`

### `GET /api/agents/state`
Returns orchestrator-facing agent state catalog.

Success `200` shape:
- `generatedAt`
- `mode`
- `items[]`
- `summary`: `{ total, active, supported }`

### `POST /api/agents/run`
Triggers a safe-mode agent task request.

Request body:
- `agentId`
- `task`
- optional: `payload`
- optional: `pipelineStage`

Success `200` shape:
- `status: "queued_simulation"`
- `simulated: true`
- `agent`
- `task`

Failure `404` shape:
- `status: "not_found"`
- `message`

### `GET /api/services/metrics`
Returns service-level metrics for automation and lifecycle simulation.

Success `200` shape:
- `generatedAt`
- `mode`
- `summary`
- `items[]`

### `POST /api/services/diagnostics`
Runs service diagnostics in safe mode with confirmation token.

Request body:
- `serviceId`
- `confirmation` (must match `ARC_SERVICE_CONFIRMATION_TOKEN`)

Success `200` shape:
- `status: "completed_simulation"`
- `simulated: true`
- `checks[]`

Failure `409` shape:
- `status: "blocked"`
- `confirmationRequired`

### `POST /api/services/restart`
Runs simulated service restart only (no real restart).

Request body:
- `serviceId`
- `confirmation` (must match `ARC_SERVICE_CONFIRMATION_TOKEN`)
- optional `simulate` (must remain true in this phase)

Success `200` shape:
- `status: "completed_simulation"`
- `simulated: true`
- `service`

Failure `409` shape:
- `status: "blocked"`

### `GET /api/repos/health`
Returns repository governance scoring and health signals.

Success `200` shape:
- `generatedAt`
- `items[]`
- `summary`: `{ total, healthy, warning, critical, averageScore }`

### `GET /api/repos/stale-branches`
Returns stale branch signal scan for discovered repositories.

Success `200` shape:
- `generatedAt`
- `staleAfterDays`
- `items[]`
- `summary`

### `GET /api/repos/dependency-risk`
Returns dependency risk signals (read-only heuristic).

Success `200` shape:
- `generatedAt`
- `items[]`
- `summary`: `{ total, high, medium, low, needsReview }`

### `GET /api/workflows`
Returns predefined operator workflow catalog.

Success `200` shape:
- `generatedAt`
- `mode`
- `safeMode`
- `items[]`

### `POST /api/workflows/run`
Runs predefined workflow in safe read-only mode.

Request body:
- `workflowId`
- `confirmation` (must match `ARC_WORKFLOW_CONFIRMATION_TOKEN`)

Success `200` shape:
- `status: "completed"`
- `mode: "safe_read_only"`
- `workflow`
- `summary`
- `outputs`

Failure `409` shape:
- `status: "blocked"`
- `message`

### `GET /api/intelligence/service-trends`
Returns service trend intelligence payload.

Success `200` shape:
- `generatedAt`
- `mode`
- `items[]` (includes `service`, `health_trend`, `failure_count`, `stability_score`, `evidence`, `confidence_score`)
- `alerts[]`
- `summary`

### `GET /api/intelligence/repo-drift`
Returns repository drift detection payload.

Success `200` shape:
- `generatedAt`
- `mode`
- `items[]` (includes `repository`, `drift_type`, `risk_level`, `evidence`, `confidence_score`)
- `alerts[]`
- `summary`

### `GET /api/intelligence/dependency-risk`
Returns dependency risk intelligence payload.

Success `200` shape:
- `generatedAt`
- `mode`
- `items[]` (includes `package`, `current_version`, `recommended_version`, `risk_score`, `evidence`, `confidence_score`)
- `alerts[]`
- `summary`

### `GET /api/intelligence/agent-activity`
Returns agent activity intelligence payload.

Success `200` shape:
- `generatedAt`
- `mode`
- `items[]` (includes `agent`, `tasks_run`, `success_rate`, `activity_trend`, `evidence`, `confidence_score`)
- `alerts[]`
- `summary`

### `GET /api/intelligence/insights`
Returns aggregated platform intelligence insights.

Success `200` shape:
- `generatedAt`
- `mode`
- `top_risks[]`
- `recommended_actions[]`
- `confidence_scores`
- `evidence_links[]`
- `summaries`

### `GET /api/assistance/insights`
Returns copilot interpretation of intelligence insights.

Success `200` shape:
- `generatedAt`
- `mode`
- `items[]` (`risk`, `recommended_action`, `confidence`, `evidence`)
- `summary`

### `GET /api/assistance/service-diagnostics`
Returns guided service diagnostic recommendations.

Success `200` shape:
- `generatedAt`
- `mode`
- `items[]` (`service`, `issue`, `diagnostic_steps`, `recommended_workflow`, `confidence`, `evidence`)
- `summary`

### `GET /api/assistance/repo-advice`
Returns repository governance cleanup recommendations.

Success `200` shape:
- `generatedAt`
- `mode`
- `items[]` (`repository`, `issue`, `risk_level`, `suggested_cleanup`, `guidance_steps`, `confidence`, `evidence`)
- `summary`

### `GET /api/assistance/workflows`
Returns workflow suggestions mapped from intelligence findings.

Success `200` shape:
- `generatedAt`
- `mode`
- `items[]` (`workflow`, `domain`, `reason`, `confidence`, `evidence`, `operator_approval_required`)
- `summary`

### `GET /api/assistance/alerts`
Returns prioritized operator notifications and next actions.

Success `200` shape:
- `generatedAt`
- `mode`
- `items[]` (`category`, `level`, `title`, `summary`, `next_action`, `confidence`, `evidence`)
- `summary`

### `GET /api/reliability/incidents`
Returns recurring incident patterns and clustered failure signatures.

Success `200` shape:
- `generatedAt`
- `mode`
- `items[]` (`incident_id`, `service`, `pattern_type`, `severity`, `occurrence_count`, `evidence`, `confidence`)
- `summary`

### `GET /api/reliability/playbooks`
Returns advisory remediation playbooks mapped from incident patterns.

Success `200` shape:
- `generatedAt`
- `mode`
- `items[]` (`incident_id`, `playbook_title`, `recommended_steps`, `prerequisites`, `rollback_checks`, `approval_required`, `confidence`, `evidence`)
- `summary`

### `GET /api/reliability/playbooks/:incidentId`
Returns a single advisory playbook for the requested incident id.

Success `200` shape:
- playbook object from `GET /api/reliability/playbooks`

Failure `404` shape:
- `error: "playbook_not_found"`
- `message`

### `GET /api/reliability/trends`
Returns reliability trend scoring by service.

Success `200` shape:
- `generatedAt`
- `mode`
- `items[]` (`service`, `reliability_score`, `trend`, `incident_count`, `warning_count`, `risk_level`, `evidence`, `confidence`)
- `summary`

### `GET /api/reliability/recovery-advice`
Returns advisory service recovery guidance.

Success `200` shape:
- `generatedAt`
- `mode`
- `items[]` (`service`, `recommended_action`, `action_mode`, `prerequisites`, `approval_required`, `confidence`, `evidence`)
- `summary`

### `GET /api/reliability/learning`
Returns local incident learning ledger entries.

Success `200` shape:
- `generatedAt`
- `mode`
- `items[]`
- `summary`

### `POST /api/reliability/learning/record`
Records an incident learning entry in local ledger storage.

Request body:
- `incident_id`
- `lesson`
- `prevention_recommendation`
- optional `confidence` (0..1)
- optional `evidence[]`

Success `201` shape:
- `record`
- `summary`

Failure `400` shape:
- `error: "invalid_learning_payload"`
- `issues[]`

### `GET /api/knowledge/nodes`
Returns normalized platform graph nodes.

Success `200` shape:
- `generatedAt`
- `mode`
- `items[]` (`node_id`, `node_type`, `attributes`)
- `summary`

### `GET /api/knowledge/relationships`
Returns confidence-scored graph relationships.

Success `200` shape:
- `generatedAt`
- `mode`
- `items[]` (`source`, `relationship`, `target`, `confidence`, `evidence`)
- `summary`

### `GET /api/knowledge/graph`
Returns assembled graph with integrity metadata.

Success `200` shape:
- `generatedAt`
- `nodes[]`
- `relationships[]`
- `metadata`
- `diagnostics`

### `GET /api/knowledge/query/service/:name`
Queries dependency/incident/workflow context for a service.

Success `200` shape:
- `found`
- `service`
- `repository`
- `dependencies[]`
- `incidents[]`
- `workflows[]`
- `metadata`

### `GET /api/knowledge/query/repository/:name`
Queries service/incident/workflow context for a repository.

Success `200` shape:
- `found`
- `repository`
- `services[]`
- `incidents[]`
- `workflows[]`
- `metadata`

### `GET /api/knowledge/snapshots`
Returns in-memory graph snapshot history.

Success `200` shape:
- `generatedAt`
- `mode`
- `latest`
- `items[]`

### `POST /api/copilot/query`
Runs an authenticated conversational copilot query in advisory mode.

Request body:
- `query` (natural-language string)
- `mode` (`concise|expanded`)

Success `200` shape:
- `query_type`
- `answer`
- `facts[]`
- `inferences[]`
- `recommended_actions[]`
- `confidence`
- `action_mode` (`informational|advisory|approval-required`)
- `evidence_sources[]`
- `warnings[]`
- `timestamp`

Failure `400` shape:
- `error: "invalid_request"`
- `message`

Failure `503` shape:
- `error: "copilot_query_unavailable"`
- `message`

### `GET /api/copilot/suggestions`
Returns predefined safe prompt suggestions for operator use.

Success `200` shape:
- `generatedAt`
- `items[]`

### `GET /api/copilot/history`
Returns local-only recent copilot interaction history.

Success `200` shape:
- `generatedAt`
- `mode: "local_only"`
- `items[]` (prompt + response summary)
- `summary`

### `POST /api/fabric/nodes/register`
Registers a managed node in local fabric metadata store.

Request body:
- `node_id`
- `node_type`
- `hostname`
- `token`
- optional `capabilities[]`

Success `201` shape:
- `node`

Failure `403` shape:
- `error: "fabric_node_registration_unauthorized"`

Failure `409` shape:
- `error: "fabric_node_duplicate"`

### `GET /api/fabric/nodes`
Returns registered fabric nodes and status summary.

Success `200` shape:
- `generatedAt`
- `mode`
- `items[]`
- `summary`
- `transitions[]`

### `GET /api/fabric/nodes/:id`
Returns one registered node by id.

Success `200` shape:
- `generatedAt`
- `mode`
- `item`

Failure `404` shape:
- `error: "fabric_node_not_found"`

### `POST /api/fabric/nodes/:id/heartbeat`
Records heartbeat for a node and updates status signal.

Request body or header:
- `token` or `x-fabric-node-token`

Success `200` shape:
- `ok`
- `node_id`
- `status`
- `last_seen`

### `POST /api/fabric/nodes/:id/telemetry`
Ingests read-only telemetry snapshot for a node.

Request body:
- `token` or `x-fabric-node-token`
- telemetry payload (supports `services`, `repositories`, `agents`, `metrics`, `warnings`)

Success `201` shape:
- `ok`
- `snapshot`

### `GET /api/fabric/telemetry`
Returns federated telemetry rollup across registered nodes.

Success `200` shape:
- `generatedAt`
- `mode`
- `items[]`
- `summary`
- `transitions[]`

### `POST /api/fabric/query`
Routes advisory distributed query across nodes.

Request body:
- `query`
- optional `node_id`

Success `200` shape:
- `generatedAt`
- `mode`
- `query`
- `query_type`
- `action_mode`
- `target`
- `results[]`
- `summary`
- `evidence_sources[]`
- `warnings[]`

### `GET /api/fabric/topology`
Returns fabric topology graph and capability relationships.

Success `200` shape:
- `generatedAt`
- `mode`
- `nodes[]`
- `relationships[]`
- `summary`
- `transitions[]`

### `GET /api/governance/policies`
Returns governance policy registry including active and disabled policies.

Success `200` shape:
- `generatedAt`
- `mode`
- `items[]` (`policy_id`, `description`, `evaluation_target`, `severity`, `threshold`, `enabled`)
- `summary`

### `GET /api/governance/evaluate`
Evaluates active governance policies and returns evidence-backed status.

Success `200` shape:
- `generatedAt`
- `mode`
- `items[]` (`policy_id`, `status`, `severity`, `evidence`, `confidence`, `recommended_action`)
- `summary`

### `GET /api/governance/drift`
Returns governance drift findings across nodes/services/repos.

Success `200` shape:
- `generatedAt`
- `mode`
- `items[]` (`component`, `drift_type`, `severity`, `evidence`, `recommended_action`)
- `summary`

### `GET /api/governance/compliance`
Returns compliance posture and trend scorecard.

Success `200` shape:
- `generatedAt`
- `mode`
- `overall_score`
- `node_score`
- `service_score`
- `repo_score`
- `trend`
- `history[]`
- `summary`

### `GET /api/governance/violations`
Returns aggregated governance violations with advisory remediation guidance.

Success `200` shape:
- `generatedAt`
- `mode`
- `items[]` (`violation_id`, `component`, `policy`, `severity`, `recommended_action`, `evidence`)
- `summary`

## Authentication Requirement
All non-auth API routes require a valid session cookie:
- `arc_console_session`

Unauthenticated access returns:
- HTTP `401`
- `{ error: "unauthorized", message: "Authentication required.", reason }`

## Error Contract
When a controller cannot fulfill a request, response status is `503` with shape:
- `error`: machine-readable code
- `message`: human-readable message
- `details` (optional): runtime detail

Examples:
- `system_status_unavailable`
- `services_unavailable`
- `service_health_unavailable`
- `repositories_unavailable`
- `agents_unavailable`
- `health_unavailable`
- `logs_unavailable`
- `agent_state_unavailable`
- `agent_run_unavailable`
- `service_metrics_unavailable`
- `service_diagnostics_unavailable`
- `service_restart_unavailable`
- `repo_health_unavailable`
- `repo_stale_branches_unavailable`
- `repo_dependency_risk_unavailable`
- `workflow_catalog_unavailable`
- `workflow_run_unavailable`
- `intelligence_service_trends_unavailable`
- `intelligence_repo_drift_unavailable`
- `intelligence_dependency_risk_unavailable`
- `intelligence_agent_activity_unavailable`
- `intelligence_insights_unavailable`
- `assistance_insights_unavailable`
- `assistance_service_diagnostics_unavailable`
- `assistance_repo_advice_unavailable`
- `assistance_workflows_unavailable`
- `assistance_alerts_unavailable`
- `reliability_incidents_unavailable`
- `reliability_playbooks_unavailable`
- `reliability_playbook_lookup_unavailable`
- `reliability_trends_unavailable`
- `reliability_recovery_advice_unavailable`
- `reliability_learning_unavailable`
- `reliability_learning_record_unavailable`
- `knowledge_nodes_unavailable`
- `knowledge_relationships_unavailable`
- `knowledge_graph_unavailable`
- `knowledge_query_service_unavailable`
- `knowledge_query_repository_unavailable`
- `knowledge_snapshots_unavailable`
- `copilot_query_unavailable`
- `copilot_history_unavailable`
- `fabric_node_registration_unavailable`
- `fabric_nodes_unavailable`
- `fabric_node_lookup_unavailable`
- `fabric_node_heartbeat_unavailable`
- `fabric_telemetry_ingest_unavailable`
- `fabric_telemetry_unavailable`
- `fabric_query_unavailable`
- `fabric_topology_unavailable`
- `governance_policies_unavailable`
- `governance_evaluation_unavailable`
- `governance_drift_unavailable`
- `governance_compliance_unavailable`
- `governance_violations_unavailable`

## Degraded-Mode Contract
Degraded mode is represented as successful `200` with warnings, not hard failure, when read-only fallbacks are available:
- Missing governance artifacts -> warnings + seeded service fallback
- Malformed CSV rows -> warnings + best-effort row parse
- Missing/empty agent state file -> warnings + default agent profile
