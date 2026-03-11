# ARC Console Operator Runbook

## Purpose
Run and operate the ARC Control Console unified server (API + dashboard) as the single local control-plane entry point.

## Project Root
- `/home/habib/workspace/platform/arc-console`

## Prerequisites
- Node.js `>= 20.11.1`
- npm dependencies installed in this project

## Environment Variables
Required/commonly used:
- `PORT` (default `4015`): unified server bind port
- `HOST` (default `0.0.0.0`): unified server bind host
- `SERVE_DASHBOARD` (default `true`): enables Next dashboard routing in unified process
- `ARC_CONSOLE_NAME` (default `ARC Control Console`)
- `ARC_CONSOLE_ENV` (default `development`)
- `WORKSPACE_ROOT` (default `/home/habib/workspace`)
- `ASSET_REGISTRY_PATH` (default operation-clean classification CSV)
- `MOVE_PLAN_RECOVERY_PATH` (default operation-clean recovery CSV)
- `AGENT_STATE_PATH` (optional JSON array; empty by default)
- `REGISTRY_CACHE_TTL_MS` (default `15000`)
- `ARC_SERVICE_CONFIRMATION_TOKEN` (default `SAFE_MODE_ACK`)
- `ARC_WORKFLOW_CONFIRMATION_TOKEN` (default `SAFE_MODE_ACK`)
- `ARC_REPO_STALE_DAYS` (default `45`)
- `OPERATOR_ACTION_LOG_PATH` (default `platform/arc-console/logs/operator-actions.log`)
- `COPILOT_CONVERSATION_STORE_PATH` (default `platform/arc-console/data/copilot-conversations.json`)
- `COPILOT_CONTEXT_TIMEOUT_MS` (default `2500`)
- `FABRIC_NODE_REGISTRY_PATH` (default `platform/arc-console/data/fabric-node-registry.json`)
- `FABRIC_TELEMETRY_STORE_PATH` (default `platform/arc-console/data/fabric-telemetry-store.json`)
- `FABRIC_NODE_REGISTRATION_TOKEN` (default `FABRIC_NODE_LOCAL_TOKEN`)
- `FABRIC_HEARTBEAT_DEGRADED_SECONDS` (default `60`)
- `FABRIC_HEARTBEAT_OFFLINE_SECONDS` (default `180`)
- `GOVERNANCE_POLICY_FILE_PATH` (optional policy override file)
- `GOVERNANCE_COMPLIANCE_HISTORY_PATH` (default `platform/arc-console/data/governance-compliance-history.json`)
- `GOVERNANCE_HEARTBEAT_MAX_OFFLINE_NODES` (default `0`)
- `GOVERNANCE_HEARTBEAT_MAX_DEGRADED_NODES` (default `0`)
- `GOVERNANCE_SERVICE_MAX_DEGRADED_SERVICES` (default `0`)
- `GOVERNANCE_REPO_MAX_STALE_REPOSITORIES` (default `0`)
- `GOVERNANCE_DEPENDENCY_MAX_HIGH_RISK` (default `0`)
- `GOVERNANCE_AGENT_MAX_STALLED_AGENTS` (default `0`)

Reference template:
- `/home/habib/workspace/platform/arc-console/.env.example`

## Startup Sequence
1. Install dependencies:
```bash
cd /home/habib/workspace/platform/arc-console
npm install
```
2. Start unified server (dev):
```bash
npm run dev
```
3. Confirm startup log includes:
- `ARC Control Console unified server listening on <host>:<port> (API + dashboard)`
4. Open login page:
- `http://127.0.0.1:4015/login`
5. Authenticate with:
- `ARC_OPERATOR_USERNAME`
- `ARC_OPERATOR_PASSWORD`

## API and Dashboard Handoff Model
- Express handles all `/api/*` routes.
- Root health/identity probe available at `/` (JSON) before dashboard handoff.
- When `SERVE_DASHBOARD=true`, Next.js handles non-API routes via `app.all("*")` handoff.
- Result: one process, one port, unified operator surface.

## Runtime Validation Checks
Run these after startup:
1. Login and session:
```bash
curl -i -H 'Content-Type: application/json' \
  -X POST http://127.0.0.1:4015/api/auth/login \
  --data '{"username":"operator","password":"operator-local-change-me"}'
```
2. API status (authenticated):
```bash
curl -sS -b cookies.txt http://127.0.0.1:4015/api/system/status | jq '.counts,.warnings'
```
3. Health (authenticated):
```bash
curl -sS -b cookies.txt http://127.0.0.1:4015/api/health | jq '.overall,.summary,.warnings|length'
```
4. Dashboard pages (authenticated):
```bash
curl -I -b cookies.txt http://127.0.0.1:4015/
curl -I -b cookies.txt http://127.0.0.1:4015/services
curl -I -b cookies.txt http://127.0.0.1:4015/repositories
curl -I -b cookies.txt http://127.0.0.1:4015/repo-health
curl -I -b cookies.txt http://127.0.0.1:4015/agents
curl -I -b cookies.txt http://127.0.0.1:4015/automation
curl -I -b cookies.txt http://127.0.0.1:4015/workflows
curl -I -b cookies.txt http://127.0.0.1:4015/intelligence
curl -I -b cookies.txt http://127.0.0.1:4015/service-trends
curl -I -b cookies.txt http://127.0.0.1:4015/repo-drift
curl -I -b cookies.txt http://127.0.0.1:4015/assistant
curl -I -b cookies.txt http://127.0.0.1:4015/diagnostics
curl -I -b cookies.txt http://127.0.0.1:4015/repo-advisor
curl -I -b cookies.txt http://127.0.0.1:4015/alerts
curl -I -b cookies.txt http://127.0.0.1:4015/reliability
curl -I -b cookies.txt http://127.0.0.1:4015/incidents
curl -I -b cookies.txt http://127.0.0.1:4015/playbooks
curl -I -b cookies.txt http://127.0.0.1:4015/recovery-advice
curl -I -b cookies.txt http://127.0.0.1:4015/graph
curl -I -b cookies.txt http://127.0.0.1:4015/service-map
curl -I -b cookies.txt http://127.0.0.1:4015/repo-map
curl -I -b cookies.txt http://127.0.0.1:4015/copilot
curl -I -b cookies.txt http://127.0.0.1:4015/copilot-history
curl -I -b cookies.txt http://127.0.0.1:4015/fabric
curl -I -b cookies.txt http://127.0.0.1:4015/nodes
curl -I -b cookies.txt http://127.0.0.1:4015/node-topology
curl -I -b cookies.txt http://127.0.0.1:4015/governance
curl -I -b cookies.txt http://127.0.0.1:4015/policies
curl -I -b cookies.txt http://127.0.0.1:4015/compliance
curl -I -b cookies.txt http://127.0.0.1:4015/violations
curl -I -b cookies.txt http://127.0.0.1:4015/security
curl -I -b cookies.txt http://127.0.0.1:4015/logs
```

5. Read-only integration adapters (authenticated):
```bash
curl -sS -b cookies.txt -X POST http://127.0.0.1:4015/api/integrations/repo-inventory/refresh
curl -sS -b cookies.txt -X POST http://127.0.0.1:4015/api/integrations/artifacts/refresh
curl -sS -b cookies.txt http://127.0.0.1:4015/api/integrations/agent-state
curl -sS -b cookies.txt http://127.0.0.1:4015/api/integrations/service-heartbeat
```

6. Operator policy endpoint (authenticated):
```bash
curl -sS -b cookies.txt http://127.0.0.1:4015/api/operator/actions
```

7. Automation endpoints (authenticated):
```bash
curl -sS -b cookies.txt http://127.0.0.1:4015/api/agents/state
curl -sS -b cookies.txt http://127.0.0.1:4015/api/services/metrics
curl -sS -b cookies.txt http://127.0.0.1:4015/api/repos/health
curl -sS -b cookies.txt http://127.0.0.1:4015/api/repos/stale-branches
curl -sS -b cookies.txt http://127.0.0.1:4015/api/repos/dependency-risk
curl -sS -b cookies.txt http://127.0.0.1:4015/api/workflows
```

8. Safe-mode workflow/service simulation (authenticated):
```bash
curl -sS -b cookies.txt -H 'Content-Type: application/json' \
  -X POST http://127.0.0.1:4015/api/workflows/run \
  --data '{"workflowId":"system-scan","confirmation":"SAFE_MODE_ACK"}'

curl -sS -b cookies.txt -H 'Content-Type: application/json' \
  -X POST http://127.0.0.1:4015/api/services/restart \
  --data '{"serviceId":"swd-pulse","confirmation":"SAFE_MODE_ACK","simulate":true}'
```

9. Intelligence endpoints (authenticated):
```bash
curl -sS -b cookies.txt http://127.0.0.1:4015/api/intelligence/service-trends
curl -sS -b cookies.txt http://127.0.0.1:4015/api/intelligence/repo-drift
curl -sS -b cookies.txt http://127.0.0.1:4015/api/intelligence/dependency-risk
curl -sS -b cookies.txt http://127.0.0.1:4015/api/intelligence/agent-activity
curl -sS -b cookies.txt http://127.0.0.1:4015/api/intelligence/insights
```

10. Assistance endpoints (authenticated):
```bash
curl -sS -b cookies.txt http://127.0.0.1:4015/api/assistance/insights
curl -sS -b cookies.txt http://127.0.0.1:4015/api/assistance/service-diagnostics
curl -sS -b cookies.txt http://127.0.0.1:4015/api/assistance/repo-advice
curl -sS -b cookies.txt http://127.0.0.1:4015/api/assistance/workflows
curl -sS -b cookies.txt http://127.0.0.1:4015/api/assistance/alerts
```

11. Reliability endpoints (authenticated):
```bash
curl -sS -b cookies.txt http://127.0.0.1:4015/api/reliability/incidents
curl -sS -b cookies.txt http://127.0.0.1:4015/api/reliability/playbooks
curl -sS -b cookies.txt http://127.0.0.1:4015/api/reliability/trends
curl -sS -b cookies.txt http://127.0.0.1:4015/api/reliability/recovery-advice
curl -sS -b cookies.txt http://127.0.0.1:4015/api/reliability/learning
```

12. Reliability learning record (authenticated POST):
```bash
curl -sS -b cookies.txt -H 'Content-Type: application/json' \
  -X POST http://127.0.0.1:4015/api/reliability/learning/record \
  --data '{"incident_id":"inc-example","lesson":"example lesson","prevention_recommendation":"example prevention","confidence":0.8,"evidence":["example"]}'
```

13. Knowledge graph endpoints (authenticated):
```bash
curl -sS -b cookies.txt http://127.0.0.1:4015/api/knowledge/nodes
curl -sS -b cookies.txt http://127.0.0.1:4015/api/knowledge/relationships
curl -sS -b cookies.txt http://127.0.0.1:4015/api/knowledge/graph
curl -sS -b cookies.txt http://127.0.0.1:4015/api/knowledge/query/service/swd-pulse
curl -sS -b cookies.txt http://127.0.0.1:4015/api/knowledge/query/repository/Workspace%20Root
curl -sS -b cookies.txt http://127.0.0.1:4015/api/knowledge/snapshots
```

14. Copilot endpoints (authenticated):
```bash
curl -sS -b cookies.txt http://127.0.0.1:4015/api/copilot/suggestions
curl -sS -b cookies.txt http://127.0.0.1:4015/api/copilot/history
curl -sS -b cookies.txt -H 'Content-Type: application/json' \
  -X POST http://127.0.0.1:4015/api/copilot/query \
  --data '{"query":"What services are currently unstable?","mode":"concise"}'
```

15. Fabric node registration + heartbeat + telemetry (authenticated):
```bash
curl -sS -b cookies.txt -H 'Content-Type: application/json' \
  -X POST http://127.0.0.1:4015/api/fabric/nodes/register \
  --data '{"node_id":"local-control-node","node_type":"local-control-node","hostname":"arc.local","capabilities":["telemetry","query"],"token":"FABRIC_NODE_LOCAL_TOKEN"}'

curl -sS -b cookies.txt -H 'Content-Type: application/json' \
  -X POST http://127.0.0.1:4015/api/fabric/nodes/local-control-node/heartbeat \
  --data '{"token":"FABRIC_NODE_LOCAL_TOKEN"}'

curl -sS -b cookies.txt -H 'Content-Type: application/json' \
  -X POST http://127.0.0.1:4015/api/fabric/nodes/local-control-node/telemetry \
  --data '{"token":"FABRIC_NODE_LOCAL_TOKEN","services":[{"name":"arc-console","status":"operational"}],"metrics":{"cpu":18,"memory":42}}'
```

16. Fabric read endpoints and distributed query (authenticated):
```bash
curl -sS -b cookies.txt http://127.0.0.1:4015/api/fabric/nodes
curl -sS -b cookies.txt http://127.0.0.1:4015/api/fabric/nodes/local-control-node
curl -sS -b cookies.txt http://127.0.0.1:4015/api/fabric/telemetry
curl -sS -b cookies.txt -H 'Content-Type: application/json' \
  -X POST http://127.0.0.1:4015/api/fabric/query \
  --data '{"query":"show services status across all nodes"}'
curl -sS -b cookies.txt http://127.0.0.1:4015/api/fabric/topology
```

17. Governance policy endpoints (authenticated):
```bash
curl -sS -b cookies.txt http://127.0.0.1:4015/api/governance/policies
curl -sS -b cookies.txt http://127.0.0.1:4015/api/governance/evaluate
curl -sS -b cookies.txt http://127.0.0.1:4015/api/governance/drift
curl -sS -b cookies.txt http://127.0.0.1:4015/api/governance/compliance
curl -sS -b cookies.txt http://127.0.0.1:4015/api/governance/violations
```

## Expected Failure-Path Behavior
- Missing governance CSV artifacts: service catalog falls back to seeded data and warnings are emitted in API payloads.
- Malformed CSV rows: best-effort parse with row-level warnings.
- Missing repo inventory inputs: repository inventory falls back safely.
- Empty/missing agent state file: default agent profile is used.
- Health-service issues: `/api/health` returns structured degraded/critical payload instead of process crash.
- Unauthenticated API access: returns `401` JSON.
- Unauthenticated dashboard access: redirects to `/login?next=<target>`.
- Missing safety confirmation token on workflow/service actions: returns `409` (`blocked`).

## Troubleshooting
- `listen EPERM` in constrained environments: run with permissions that allow local socket binding.
- Next.js lockfile root warning: non-blocking; can be reduced by setting Turbopack root in Next config if needed.
- Unexpected empty API data: call endpoints with `?refresh=true` to bypass cache and inspect `warnings` field.

## CI / Local Quality Gates
- `npm run lint`
- `npm run test`
- `npm run dashboard:build`
- `npm run verify`

## Shutdown
- If running in foreground: `Ctrl+C`
- If running in background: `kill <pid>` and verify port is released.
