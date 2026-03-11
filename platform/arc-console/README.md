# ARC Control Console

ARC Control Console is the unified operator cockpit for the ARC platform.

## Phase 13 Status

Phase 13 autonomous platform governance baseline is initialized with:

- live system registry loading from workspace governance artifacts
- repository inventory discovery from real git topology
- authenticated dashboard/API boundary with local session cookies
- governance summary widgets and warning center
- structured observability events and route latency metrics
- lint/test/build quality-gate workflow and verify script
- read-only integration adapters for repo/artifact refresh and optional endpoints
- operator action policy model (defined, not enabled)
- unified server startup flow (Express API + Next.js dashboard on one server)
- operator-triggered automation modules:
  - agent orchestration
  - service lifecycle simulation
  - repository governance scanning
  - predefined operator workflows
- mandatory operator action audit logs at `logs/operator-actions.log`
- intelligence modules:
  - service trend analysis
  - repository drift detection
  - dependency risk scoring
  - agent activity analytics
  - platform insight aggregation
- assistance modules:
  - insight interpretation copilot
  - service diagnostic guidance
  - repository cleanup advisory
  - workflow recommendation guidance
  - operator alert prioritization
- reliability advisory modules:
  - incident pattern detection
  - remediation playbook generation
  - reliability trend analysis
  - service recovery advisory
  - incident learning ledger
- knowledge graph modules:
  - node registry
  - relationship mapping
  - graph builder and validation
  - graph query engine
  - graph snapshot history
- copilot modules:
  - query router and context assembler
  - reasoning engine and response formatter
  - conversational controller and suggestions
  - local conversation history store
- distributed fabric modules:
  - node registry and registration controls
  - heartbeat monitor and offline signal handling
  - federated telemetry aggregation
  - distributed query routing
  - fabric topology mapping
- governance modules:
  - policy registry with configurable thresholds
  - policy evaluation engine
  - drift detection across nodes/services/repos
  - compliance scoring and trend tracking
  - aggregated violation reporting

## Structure

- `server/` Express unified server, controllers, services, routes, and config
- `dashboard/` Next.js pages and components rendered through the unified server
- `docs/` architecture and integration contracts

## API Endpoints

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `GET /api/system/status`
- `GET /api/services`
- `GET /api/services/health`
- `GET /api/repos`
- `GET /api/agents`
- `GET /api/governance/summary`
- `GET /api/health`
- `GET /api/logs`
- `POST /api/integrations/repo-inventory/refresh`
- `POST /api/integrations/artifacts/refresh`
- `GET /api/integrations/agent-state`
- `GET /api/integrations/service-heartbeat`
- `GET /api/operator/actions`
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
- `GET /api/intelligence/service-trends`
- `GET /api/intelligence/repo-drift`
- `GET /api/intelligence/dependency-risk`
- `GET /api/intelligence/agent-activity`
- `GET /api/intelligence/insights`
- `GET /api/assistance/insights`
- `GET /api/assistance/service-diagnostics`
- `GET /api/assistance/repo-advice`
- `GET /api/assistance/workflows`
- `GET /api/assistance/alerts`
- `GET /api/reliability/incidents`
- `GET /api/reliability/playbooks`
- `GET /api/reliability/playbooks/:incidentId`
- `GET /api/reliability/trends`
- `GET /api/reliability/recovery-advice`
- `GET /api/reliability/learning`
- `POST /api/reliability/learning/record`
- `GET /api/knowledge/nodes`
- `GET /api/knowledge/relationships`
- `GET /api/knowledge/graph`
- `GET /api/knowledge/query/service/:name`
- `GET /api/knowledge/query/repository/:name`
- `GET /api/knowledge/snapshots`
- `POST /api/copilot/query`
- `GET /api/copilot/suggestions`
- `GET /api/copilot/history`
- `POST /api/fabric/nodes/register`
- `GET /api/fabric/nodes`
- `GET /api/fabric/nodes/:id`
- `POST /api/fabric/nodes/:id/heartbeat`
- `POST /api/fabric/nodes/:id/telemetry`
- `GET /api/fabric/telemetry`
- `POST /api/fabric/query`
- `GET /api/fabric/topology`
- `GET /api/governance/policies`
- `GET /api/governance/evaluate`
- `GET /api/governance/drift`
- `GET /api/governance/compliance`
- `GET /api/governance/violations`

## Local Startup

```bash
npm install
npm run dev
npm run verify
```

Default port:

- unified server (API + dashboard): `4015`

## Notes

Set operator credentials in environment before use:
- `ARC_OPERATOR_USERNAME`
- `ARC_OPERATOR_PASSWORD`
- `ARC_SESSION_SECRET`

The registry and health services remain read-only. Control actions and write-path integrations remain governance-gated follow-up work.
