# ARC Console Runtime Validation

## Phase 4 Addendum (Operational Maturity)

### Scope
- Authentication boundary validation
- Protected API/dashboard route validation
- Governance widget data endpoint validation
- Observability event and latency metric validation

### Runtime Evidence
- Unauthenticated API call:
  - `GET /api/system/status` -> `401` with `unauthorized` payload
- Unauthenticated dashboard call:
  - `GET /` -> `302` redirect to `/login?next=%2F`
- Login flow:
  - `POST /api/auth/login` -> `200`, session cookie issued
- Authenticated protected routes:
  - `GET /api/system/status` -> `200`
  - `GET /api/governance/summary` -> `200`
  - `GET /api/logs` -> `200`
  - `GET /api/health` -> `200`
- Authenticated dashboard routes:
  - `/`, `/services`, `/repositories`, `/agents`, `/security`, `/logs` -> `200`
- Logout flow:
  - `POST /api/auth/logout` -> `200`
  - post-logout `GET /api/system/status` -> `401`

### Evidence Paths
- `/tmp/arc-console-phase4-final/server.log`
- `/tmp/arc-console-phase4-final/unauth-system.json`
- `/tmp/arc-console-phase4-final/unauth-dashboard.headers`
- `/tmp/arc-console-phase4-final/login-response.json`
- `/tmp/arc-console-phase4-final/auth-system-status.json`
- `/tmp/arc-console-phase4-final/auth-governance-summary.json`
- `/tmp/arc-console-phase4-final/auth-logs.json`
- `/tmp/arc-console-phase4-final/auth-health.json`
- `/tmp/arc-console-phase4-final/page-_.html`

## Phase 5 Addendum (Production Readiness Baseline)

### Scope
- CI-quality gate command validation (`npm run verify`)
- auth hardening validation (failed-login rate handling)
- integration control adapter validation (read-only endpoints)
- operator action policy endpoint validation (defined, not enabled)

### Runtime Evidence
- `npm run verify` completed:
  - lint exit code `0` (with non-fatal Next pages-path warning)
  - tests pass (`3/3`)
  - dashboard build pass
- failed-login rate handling:
  - first two invalid login attempts -> `401`
  - third invalid attempt -> `429` with `retryAfterSeconds`
- integration adapters (authenticated):
  - `POST /api/integrations/repo-inventory/refresh` -> `200`
  - `POST /api/integrations/artifacts/refresh` -> `200`
  - `GET /api/integrations/agent-state` -> `200`
  - `GET /api/integrations/service-heartbeat` -> `200`
- operator policy endpoint (authenticated):
  - `GET /api/operator/actions` -> `200`
  - `enabled: false`, action status `defined_not_enabled`
- new protected endpoints (unauthenticated):
  - `POST /api/integrations/repo-inventory/refresh` -> `401`
  - `GET /api/operator/actions` -> `401`
- auth audit events present in logs:
  - `auth.login success`
  - `auth.login failed`
  - `auth.login rate_limited`
  - `auth.session missing`

### Evidence Paths
- `/tmp/arc-console-phase5/server.log`
- `/tmp/arc-console-phase5/login-success.json`
- `/tmp/arc-console-phase5/login-fail-1.json`
- `/tmp/arc-console-phase5/login-fail-2.json`
- `/tmp/arc-console-phase5/login-fail-3.json`
- `/tmp/arc-console-phase5/integration-repo-refresh.json`
- `/tmp/arc-console-phase5/integration-artifacts-refresh.json`
- `/tmp/arc-console-phase5/integration-agent-state.json`
- `/tmp/arc-console-phase5/integration-service-heartbeat.json`
- `/tmp/arc-console-phase5/operator-actions.json`
- `/tmp/arc-console-phase5/logs.json`
- `/tmp/arc-console-phase5/unauth-integration-post.json`
- `/tmp/arc-console-phase5/unauth-operator-get.json`

## Validation Timestamp
- `2026-03-09T16:38:29Z` (UTC)

## Scope
Phase 3 runtime validation and hardening checks for the unified ARC server:
- runtime boot validation
- API smoke tests
- dashboard render checks
- failure-path checks (missing artifacts, malformed CSV)

## Commands Executed
1. Dependency install
```bash
npm install --no-audit --no-fund
```
Result: `up to date in 15s`

2. Unified server startup command (used in automated test harness)
```bash
PORT=<port> HOST=127.0.0.1 SERVE_DASHBOARD=true NODE_ENV=development node server/index.js
```

3. API smoke-test pattern
```bash
curl -sS -o <file> -w '%{http_code}' http://127.0.0.1:<port>/api/<endpoint>
```

4. Dashboard page checks
```bash
curl -sS -o <file> -w '%{http_code}' http://127.0.0.1:<port>/<page>
```

## Runtime Boot Results

### Normal input case (`port 4015`)
- Runtime status: `runtime_ok`
- Port bind evidence:
  - `LISTEN ... 127.0.0.1:4015 ...`
- Startup log includes:
  - `ARC Control Console unified server listening on 127.0.0.1:4015 (API + dashboard)`

### Missing artifact case (`port 4016`)
- Runtime status: `runtime_ok`
- Port bind evidence:
  - `LISTEN ... 127.0.0.1:4016 ...`
- Startup log includes:
  - `ARC Control Console unified server listening on 127.0.0.1:4016 (API + dashboard)`

### Malformed CSV case (`port 4017`)
- Runtime status: `runtime_ok`
- Port bind evidence:
  - `LISTEN ... 127.0.0.1:4017 ...`
- Startup log includes:
  - `ARC Control Console unified server listening on 127.0.0.1:4017 (API + dashboard)`

## API Smoke-Test Results
All declared endpoints returned `200` in all three cases.

Validated endpoints:
- `GET /api/system/status`
- `GET /api/services`
- `GET /api/services/health`
- `GET /api/repos`
- `GET /api/agents`
- `GET /api/health`
- `GET /api/logs`

JSON shape checks confirmed expected top-level keys.

## Dashboard Render Results
All target pages returned `200` in all three cases:
- `/`
- `/services`
- `/repositories`
- `/agents`
- `/security`
- `/logs`

Marker checks found expected page titles/content in rendered HTML for all routes.

## Failure-Path Hardening Validation

### Missing artifacts (`ASSET_REGISTRY_PATH`, `MOVE_PLAN_RECOVERY_PATH`, `AGENT_STATE_PATH` invalid)
- API remained available (`200` responses)
- `/api/system/status` included warnings:
  - `csv_missing` (asset registry)
  - `csv_missing` (move plan)
  - `service_catalog_fallback`
  - `agent_state_missing`
- Services payload fell back safely to seeded catalog (`4` items)

### Malformed asset CSV
- API remained available (`200` responses)
- `/api/system/status` included warnings:
  - `csv_row_malformed`
  - `csv_row_shape_mismatch`
  - `agent_state_missing`
- Service ingestion continued with best-effort parsing (`2` items)

### Missing repository inventory input (`WORKSPACE_ROOT` invalid)
- API remained available (`200` responses)
- `/api/system/status` included warning:
  - `workspace_root_missing`
- `/api/repos` returned seeded fallback inventory summary (`total: 4`)

### Empty-state handling (`/api/agents?status=nonexistent`)
- Endpoint returned `200`
- Payload returned:
  - `items: []`
  - `summary: { total: 0, active: 0, standby: 0 }`
  - `warnings: ["No agent entries matched the requested filter."]`

## Non-Blocking Runtime Note
Next.js reports a workspace-root warning due multiple lockfiles. This did not block startup or route rendering.

## Evidence Artifacts
- `/tmp/arc-console-phase3/post/normal/*`
- `/tmp/arc-console-phase3/post/missing_artifacts/*`
- `/tmp/arc-console-phase3/post/malformed_csv/*`

Key evidence files:
- `api-status-codes.txt`
- `page-status-codes.txt`
- `api-system-status.json`
- `api-health.json`
- `server.log`
- `port-binding.txt`
- `/tmp/arc-console-phase3/empty-state/api-agents-empty.json`
- `/tmp/arc-console-phase3/repo-missing/api-system-status.json`
- `/tmp/arc-console-phase3/repo-missing/api-repos.json`

## Phase 6 Addendum — Automation Runtime Validation (2026-03-09)

Evidence directory:
- `/tmp/arc-console-phase6/`

Validated results:
- Unauthenticated `GET /api/agents/state` -> `401`
- Authenticated automation read endpoints -> `200`
  - `/api/agents/state`
  - `/api/services/metrics`
  - `/api/repos/health`
  - `/api/repos/stale-branches`
  - `/api/repos/dependency-risk`
  - `/api/workflows`
- Safety confirmation enforcement:
  - `POST /api/workflows/run` with bad token -> `409`
  - `POST /api/workflows/run` with valid token -> `200`
  - `POST /api/services/restart` with bad token -> `409`
  - `POST /api/services/restart` with valid token -> `200` (`completed_simulation`)
  - `POST /api/services/diagnostics` with valid token -> `200` (`completed_simulation`)
  - `POST /api/agents/run` -> `200` (`queued_simulation`)
- Authenticated dashboard route checks -> `200`
  - `/`
  - `/automation`
  - `/workflows`
  - `/repo-health`

Audit sink validation:
- `logs/operator-actions.log` contains action entries for workflow and service simulation attempts.

## Phase 7 Addendum — Intelligence Runtime Validation (2026-03-09)

Evidence directory:
- `/tmp/arc-console-phase7/`

Validated results:
- Unauthenticated `GET /api/intelligence/insights` -> `401`
- Authenticated intelligence endpoints -> `200`
  - `/api/intelligence/service-trends`
  - `/api/intelligence/repo-drift`
  - `/api/intelligence/dependency-risk`
  - `/api/intelligence/agent-activity`
  - `/api/intelligence/insights`
- Authenticated intelligence dashboard routes -> `200`
  - `/intelligence`
  - `/service-trends`
  - `/repo-drift`
- Observability event emission validated:
  - `INTELLIGENCE_SUMMARY`
  - `INTELLIGENCE_ALERT`
  - verified in `/api/logs` payload (`source: intelligence`)

## Phase 8 Addendum — Assistance Runtime Validation (2026-03-09)

Evidence directory:
- `/tmp/arc-console-phase8/`

Validated results:
- Unauthenticated `GET /api/assistance/alerts` -> `401`
- Authenticated assistance endpoints -> `200`
  - `/api/assistance/insights`
  - `/api/assistance/service-diagnostics`
  - `/api/assistance/repo-advice`
  - `/api/assistance/workflows`
  - `/api/assistance/alerts`
- Authenticated assistance dashboard routes -> `200`
  - `/assistant`
  - `/diagnostics`
  - `/repo-advisor`
  - `/alerts`
- Observability event emission validated:
  - `ASSISTANCE_RECOMMENDATION`
  - `ASSISTANCE_ALERT`
  - `ASSISTANCE_WORKFLOW_SUGGESTION`
  - verified in `/api/logs` payload (`source: assistance`)

## Phase 9 Addendum — Reliability Advisory Runtime Validation (2026-03-09)

Evidence directory:
- `/tmp/arc-console-phase9/`

Validated results:
- Unauthenticated `GET /api/reliability/incidents` -> `401`
- Authenticated reliability endpoints -> `200`
  - `/api/reliability/incidents`
  - `/api/reliability/playbooks`
  - `/api/reliability/trends`
  - `/api/reliability/recovery-advice`
  - `/api/reliability/learning`
- Playbook by incident endpoint:
  - `/api/reliability/playbooks/:incidentId` returns `404` when no current incident rows exist
- Learning ledger write validation:
  - invalid payload -> `400`
  - valid payload -> `201` (`RELIABILITY_LEARNING_RECORDED`)
- Authenticated reliability dashboard routes -> `200`
  - `/reliability`
  - `/incidents`
  - `/playbooks`
  - `/recovery-advice`
- Observability event emission validated:
  - `RELIABILITY_INCIDENT_DETECTED`
  - `RELIABILITY_PLAYBOOK_SUGGESTED`
  - `RELIABILITY_TREND_SUMMARY`
  - `RELIABILITY_LEARNING_RECORDED`
  - verified in `/api/logs` payload (`source: reliability`)

## Phase 10 Addendum — Knowledge Graph Runtime Validation (2026-03-09)

Evidence directory:
- `/tmp/arc-console-phase10/`

Validated results:
- Unauthenticated `GET /api/knowledge/graph` -> `401`
- Authenticated knowledge endpoints -> `200`
  - `/api/knowledge/nodes`
  - `/api/knowledge/relationships`
  - `/api/knowledge/graph`
  - `/api/knowledge/query/service/:name`
  - `/api/knowledge/query/repository/:name`
  - `/api/knowledge/snapshots`
- Authenticated knowledge dashboard routes -> `200`
  - `/graph`
  - `/service-map`
  - `/repo-map`
- Safe empty-state behavior confirmed:
  - graph can be built with zero incident/playbook links without runtime failure
  - missing relationships are tolerated via graph metadata diagnostics
- Observability event emission validated:
  - `KNOWLEDGE_GRAPH_BUILT`
  - `KNOWLEDGE_GRAPH_QUERY`
  - `KNOWLEDGE_GRAPH_SNAPSHOT`
  - verified in `/api/logs` payload (`source: knowledge`)

## Phase 11 Addendum — Copilot Runtime Validation (2026-03-09)

Evidence directory:
- `/tmp/arc-console-phase11/`

Validated results:
- Unauthenticated copilot API access:
  - `POST /api/copilot/query` -> `401`
  - `GET /api/copilot/history` -> `401`
- Unauthenticated copilot dashboard route:
  - `/copilot` -> `302` redirect to login
- Authenticated copilot endpoints -> `200`
  - `GET /api/copilot/suggestions`
  - `GET /api/copilot/history`
  - `POST /api/copilot/query`
- Copilot response contract fields verified:
  - `query_type`, `answer`, `facts`, `inferences`, `recommended_actions`
  - `confidence`, `action_mode`, `evidence_sources`, `warnings`, `timestamp`
- Sensitive-query safety behavior verified:
  - query containing secret-like terms returns `200` with `sensitive_request` policy warning and no secret output
- Authenticated copilot dashboard routes -> `200`
  - `/copilot`
  - `/copilot-history`
- Observability event emission validated:
  - `COPILOT_QUERY`
  - `COPILOT_RESPONSE`
  - `COPILOT_WARNING`
  - verified in `/api/logs` payload (`source: copilot`)

## Phase 12 Addendum — Distributed Fabric Runtime Validation (2026-03-09)

Evidence directory:
- `/tmp/arc-console-phase12/`

Validated results:
- Unauthenticated fabric API access:
  - `GET /api/fabric/nodes` -> `401`
- Authenticated node registration and validation:
  - `POST /api/fabric/nodes/register` -> `201`
  - duplicate node registration -> `409`
- Authenticated node lifecycle endpoints:
  - `POST /api/fabric/nodes/:id/heartbeat` -> `200`
  - `POST /api/fabric/nodes/:id/telemetry` -> `201`
- Authenticated fabric read/query endpoints -> `200`
  - `GET /api/fabric/nodes`
  - `GET /api/fabric/nodes/:id`
  - `GET /api/fabric/telemetry`
  - `POST /api/fabric/query`
  - `GET /api/fabric/topology`
- Authenticated fabric dashboard routes -> `200`
  - `/fabric`
  - `/nodes`
  - `/node-topology`
- Offline-node handling validated:
  - stale registered nodes transitioned to `offline` in `/api/fabric/nodes` transitions payload
  - offline transition evidence captured in `/tmp/arc-console-phase12/fabric-nodes-offline2.json`
  - offline event emission verified in `/tmp/arc-console-phase12/logs-offline2.json`
- Observability event emission validated:
  - `FABRIC_NODE_REGISTERED`
  - `FABRIC_NODE_HEARTBEAT`
  - `FABRIC_NODE_OFFLINE`
  - `FABRIC_QUERY_ROUTED`
  - verified in `/api/logs` payload (`source: fabric`)

## Phase 13 Addendum — Autonomous Governance Runtime Validation (2026-03-09)

Evidence directory:
- `/tmp/arc-console-phase13/`

Validated results:
- Unauthenticated governance API access:
  - `GET /api/governance/evaluate` -> `401`
- Authenticated governance endpoints -> `200`
  - `GET /api/governance/policies`
  - `GET /api/governance/evaluate`
  - `GET /api/governance/drift`
  - `GET /api/governance/compliance`
  - `GET /api/governance/violations`
- Governance output integrity validated:
  - policy rows include configurable thresholds and severity
  - evaluation rows include status, evidence, confidence
  - compliance returns overall/node/service/repo scores with trend
  - violation rows include severity, evidence, and remediation guidance
- Governance dashboard routes (authenticated) -> `200`
  - `/governance`
  - `/policies`
  - `/compliance`
  - `/violations`
- Intelligence integration validated:
  - `GET /api/intelligence/insights` -> `200`
  - `top_risks` includes governance-domain risks sourced from governance violations
- Copilot integration validated:
  - governance-focused copilot query -> `200`
  - response includes governance evidence sources (`governance_policies`, `governance_evaluation`, `governance_drift`, `governance_compliance`, `governance_violations`)
- Observability event emission validated:
  - `GOVERNANCE_POLICY_EVALUATED`
  - `GOVERNANCE_VIOLATION_DETECTED`
  - `GOVERNANCE_COMPLIANCE_UPDATED`
  - verified in `/api/logs` payload (`source: governance`)
