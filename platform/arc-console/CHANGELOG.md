# Changelog

## [Unreleased]

### Added
- Placeholder for upcoming changes.

## [v0.13.0-internal-rc1] - 2026-03-09

### Added
- Governance modules under `server/governance/`:
  - `policyRegistry.js`
  - `policyEvaluator.js`
  - `driftDetector.js`
  - `complianceScorer.js`
  - `violationReporter.js`
- Governance controller and protected endpoint surface:
  - `GET /api/governance/policies`
  - `GET /api/governance/evaluate`
  - `GET /api/governance/drift`
  - `GET /api/governance/compliance`
  - `GET /api/governance/violations`
- Dashboard pages:
  - `/governance`
  - `/policies`
  - `/compliance`
  - `/violations`
- Governance observability event types:
  - `GOVERNANCE_POLICY_EVALUATED`
  - `GOVERNANCE_VIOLATION_DETECTED`
  - `GOVERNANCE_COMPLIANCE_UPDATED`
- Phase 13 docs:
  - `governance-architecture.md`
  - `policy-model.md`
  - `compliance-scoring.md`
- Governance test suite:
  - `tests/governance.test.js`

### Changed
- Intelligence platform insights now ingest governance violations/compliance context.
- Copilot context assembly and governance reasoning now include governance policy outputs.
- Navigation, API contract, security model, observability docs, and operator runbook updated for governance surfaces.
- Environment profile expanded with governance policy/configuration controls.

## [v0.12.0-internal-rc1] - 2026-03-09

### Added
- Fabric modules under `server/fabric/`:
  - `nodeRegistry.js`
  - `nodeHeartbeatMonitor.js`
  - `nodeTelemetryAggregator.js`
  - `nodeQueryRouter.js`
  - `fabricTopologyMap.js`
- Fabric controller and protected endpoint surface:
  - `POST /api/fabric/nodes/register`
  - `GET /api/fabric/nodes`
  - `GET /api/fabric/nodes/:id`
  - `POST /api/fabric/nodes/:id/heartbeat`
  - `POST /api/fabric/nodes/:id/telemetry`
  - `GET /api/fabric/telemetry`
  - `POST /api/fabric/query`
  - `GET /api/fabric/topology`
- Dashboard pages:
  - `/fabric`
  - `/nodes`
  - `/node-topology`
- Fabric observability event types:
  - `FABRIC_NODE_REGISTERED`
  - `FABRIC_NODE_HEARTBEAT`
  - `FABRIC_NODE_OFFLINE`
  - `FABRIC_QUERY_ROUTED`
- Phase 12 docs:
  - `fabric-architecture.md`
  - `node-registration.md`
  - `distributed-operations.md`

### Changed
- Navigation, API contract, security model, observability docs, and operator runbook updated for distributed fabric surfaces.
- Environment profile expanded with fabric registry/telemetry paths and heartbeat thresholds.

## [v0.11.0-internal-rc1] - 2026-03-09

### Added
- Copilot modules under `server/copilot/`:
  - `copilotController.js`
  - `queryRouter.js`
  - `contextAssembler.js`
  - `reasoningEngine.js`
  - `responseFormatter.js`
  - `conversationStore.js`
- New protected copilot endpoints:
  - `POST /api/copilot/query`
  - `GET /api/copilot/suggestions`
  - `GET /api/copilot/history`
- Dashboard pages:
  - `/copilot`
  - `/copilot-history`
- Copilot observability event types:
  - `COPILOT_QUERY`
  - `COPILOT_RESPONSE`
  - `COPILOT_WARNING`
- Phase 11 docs:
  - `copilot-architecture.md`
  - `copilot-safety-model.md`
  - `copilot-usage-guide.md`

### Changed
- Navigation, API contract, security model, observability docs, and operator runbook updated for copilot surfaces.
- Copilot source mapping and controller hardening updated for timeout/failure-safe behavior.

## [v0.10.0-internal-rc1] - 2026-03-09

### Added
- Knowledge graph modules under `server/knowledge/`:
  - `nodeRegistry.js`
  - `relationshipMapper.js`
  - `graphBuilder.js`
  - `graphQueryEngine.js`
  - `graphSnapshotStore.js`
- New protected knowledge endpoints:
  - `GET /api/knowledge/nodes`
  - `GET /api/knowledge/relationships`
  - `GET /api/knowledge/graph`
  - `GET /api/knowledge/query/service/:name`
  - `GET /api/knowledge/query/repository/:name`
  - `GET /api/knowledge/snapshots`
- Dashboard pages:
  - `/graph`
  - `/service-map`
  - `/repo-map`
- Knowledge graph observability event types:
  - `KNOWLEDGE_GRAPH_BUILT`
  - `KNOWLEDGE_GRAPH_QUERY`
  - `KNOWLEDGE_GRAPH_SNAPSHOT`
- Phase 10 docs:
  - `knowledge-graph-architecture.md`
  - `graph-data-model.md`
  - `graph-query-guide.md`

### Changed
- Navigation, API contract, security model, observability docs, and operator runbook updated for knowledge graph features.

## [v0.9.0-internal-rc1] - 2026-03-09

### Added
- Reliability modules under `server/reliability/`:
  - `incidentPatternDetector.js`
  - `remediationPlaybookEngine.js`
  - `reliabilityTrendAnalyzer.js`
  - `serviceRecoveryAdvisor.js`
  - `incidentLearningLedger.js`
- New protected reliability endpoints:
  - `GET /api/reliability/incidents`
  - `GET /api/reliability/playbooks`
  - `GET /api/reliability/playbooks/:incidentId`
  - `GET /api/reliability/trends`
  - `GET /api/reliability/recovery-advice`
  - `GET /api/reliability/learning`
  - `POST /api/reliability/learning/record`
- Dashboard pages:
  - `/reliability`
  - `/incidents`
  - `/playbooks`
  - `/recovery-advice`
- Reliability observability events:
  - `RELIABILITY_INCIDENT_DETECTED`
  - `RELIABILITY_PLAYBOOK_SUGGESTED`
  - `RELIABILITY_TREND_SUMMARY`
  - `RELIABILITY_LEARNING_RECORDED`
- Phase 9 docs:
  - `reliability-architecture.md`
  - `self-healing-advisory.md`
  - `incident-playbooks.md`

### Changed
- Navigation, API contract, security model, observability docs, and operator runbook updated for reliability advisory surfaces.

## [v0.8.0-internal-rc1] - 2026-03-09

### Added
- Assistance modules under `server/assistance/`:
  - `insightInterpreter.js`
  - `diagnosticCopilot.js`
  - `repoCleanupAdvisor.js`
  - `workflowAdvisor.js`
  - `operatorNotifier.js`
- New protected assistance endpoints:
  - `GET /api/assistance/insights`
  - `GET /api/assistance/service-diagnostics`
  - `GET /api/assistance/repo-advice`
  - `GET /api/assistance/workflows`
  - `GET /api/assistance/alerts`
- Dashboard pages:
  - `/assistant`
  - `/diagnostics`
  - `/repo-advisor`
  - `/alerts`
- Assistance observability event types:
  - `ASSISTANCE_RECOMMENDATION`
  - `ASSISTANCE_ALERT`
  - `ASSISTANCE_WORKFLOW_SUGGESTION`
- Phase 8 docs:
  - `assistance-architecture.md`
  - `operator-assistance.md`
  - `copilot-model.md`

### Changed
- Navigation, API contract, security model, observability docs, and operator runbook updated for assistance surfaces.

## [v0.7.0-internal-rc1] - 2026-03-09

### Added
- Intelligence modules under `server/intelligence/`:
  - `serviceTrendAnalyzer.js`
  - `repoDriftDetector.js`
  - `dependencyRiskAnalyzer.js`
  - `agentActivityAnalyzer.js`
  - `platformInsightsEngine.js`
- New protected intelligence endpoints:
  - `GET /api/intelligence/service-trends`
  - `GET /api/intelligence/repo-drift`
  - `GET /api/intelligence/dependency-risk`
  - `GET /api/intelligence/agent-activity`
  - `GET /api/intelligence/insights`
- Dashboard pages:
  - `/intelligence`
  - `/service-trends`
  - `/repo-drift`
- Observability event type support:
  - `INTELLIGENCE_SUMMARY`
  - `INTELLIGENCE_ALERT`
- Phase 7 docs:
  - `intelligence-architecture.md`
  - `intelligence-model.md`
  - `intelligence-usage.md`

### Changed
- Navigation expanded for intelligence surfaces.
- API contract, runbook, security model, and observability docs updated for intelligence routes and events.

## [v0.6.0-internal-rc1] - 2026-03-09

### Added
- Phase 6 automation modules under `server/automation/`:
  - `agentOrchestrator.js`
  - `serviceController.js`
  - `repoGovernor.js`
  - `operatorWorkflow.js`
- New protected automation endpoints:
  - `GET /api/agents/state`
  - `POST /api/agents/run`
  - `GET /api/services/metrics`
  - `POST /api/services/diagnostics`
  - `POST /api/services/restart`
  - `GET /api/repos/health`
  - `GET /api/repos/stale-branches`
  - `GET /api/repos/dependency-risk`
  - `GET /api/workflows`
  - `POST /api/workflows/run`
- Dashboard pages:
  - `/automation`
  - `/workflows`
  - `/repo-health`
- Durable operator action audit log sink:
  - `logs/operator-actions.log`
- Phase 6 governance docs:
  - `automation-architecture.md`
  - `operator-workflows.md`
  - `platform-governance-model.md`

### Changed
- Extended environment profile with safety confirmation tokens and repo stale-branch threshold.
- Updated API contract and operator runbook for Phase 6 automation behavior.
- Added navigation entries for automation and repo-health surfaces.

## [v0.5.0-internal-rc1] - 2026-03-09

### Added
- ESLint 9 flat config and lint recovery.
- Baseline auth and rate-limit tests with normalized `npm run test`.
- CI quality gate workflow for lint/test/build.
- Auth hardening controls:
  - failed-login throttling
  - session-secret rotation support (`ARC_SESSION_PREVIOUS_SECRETS`)
  - auth audit event coverage
- Read-only integration adapters:
  - repo inventory refresh
  - artifact signal refresh
  - optional agent-state endpoint
  - optional service-heartbeat endpoint
- Operator actions policy endpoint (`defined_not_enabled`).
- Phase 5 governance docs:
  - `ci-quality-gates.md`
  - `auth-hardening.md`
  - `integration-control-policy.md`
  - `operator-actions-policy.md`

### Changed
- Project version bumped to `0.5.0-rc1`.
- Security and runbook docs updated for hardening and integration controls.

## [v0.4.0-internal-candidate] - 2026-03-09

### Added
- Local operator authentication with signed session cookies.
- Protected dashboard and API route model with explicit unauthenticated responses.
- Governance summary endpoint and dashboard widgets:
  - priority/status distribution
  - repo boundary status
  - recovery backlog summary
  - warning center
  - system health summary
- Structured observability baseline:
  - request events
  - warning/error events
  - route latency metrics

### Changed
- Unified server profile now includes auth-aware middleware and request ID emission.
- Logs endpoint now returns observability snapshot and runtime event stream.
- Dashboard layout includes operator sign-out flow and warning badge.

### Security
- Added local auth boundary guardrails and session controls.
- Added documentation for security model and unauthenticated behavior.

### Notes
- This is an internal candidate marker, not a production release.
