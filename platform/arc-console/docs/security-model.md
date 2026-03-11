# ARC Console Security Model

## Scope
This document defines the Phase 13 local authentication and operator-action boundary for ARC Console.

## Security Objectives
- Require operator authentication before dashboard and control-plane API access.
- Return explicit unauthenticated behavior (`401` for API, redirect for dashboard).
- Prevent sensitive credential/session material from being rendered in UI or logs.
- Keep all operations read-only by default for governance workflows.

## Auth Strategy (Local)
ARC Console uses local credential authentication with a signed session cookie.

Credential inputs:
- `ARC_OPERATOR_USERNAME`
- `ARC_OPERATOR_PASSWORD`

Session controls:
- `ARC_SESSION_SECRET` for HMAC signing
- `ARC_SESSION_PREVIOUS_SECRETS` for verification during rotation windows
- `ARC_SESSION_TTL_SECONDS` for expiry
- HttpOnly cookie: `arc_console_session`
- SameSite: `Lax`
- Secure flag enabled automatically in production mode
- failed-login throttling with:
  - `ARC_AUTH_RATE_WINDOW_MS`
  - `ARC_AUTH_MAX_ATTEMPTS`
  - `ARC_AUTH_BLOCK_SECONDS`

## Protected Surface

Public API routes:
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`

Protected API routes:
- `GET /api/system/status`
- `GET /api/services`
- `GET /api/services/health`
- `GET /api/repos`
- `GET /api/agents`
- `GET /api/governance/summary`
- `GET /api/health`
- `GET /api/logs`
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

Protected dashboard routes:
- `/`
- `/services`
- `/repositories`
- `/repo-health`
- `/agents`
- `/automation`
- `/workflows`
- `/intelligence`
- `/service-trends`
- `/repo-drift`
- `/assistant`
- `/diagnostics`
- `/repo-advisor`
- `/alerts`
- `/reliability`
- `/incidents`
- `/playbooks`
- `/recovery-advice`
- `/graph`
- `/service-map`
- `/repo-map`
- `/copilot`
- `/copilot-history`
- `/fabric`
- `/nodes`
- `/node-topology`
- `/governance`
- `/policies`
- `/compliance`
- `/violations`
- `/security`
- `/logs`

Public dashboard route:
- `/login`

## Unauthenticated Behavior
- API: HTTP `401` with JSON body:
  - `error: "unauthorized"`
  - `message: "Authentication required."`
  - `reason` field
- Dashboard pages: redirect to `/login?next=<target>`.

## Guardrails
- No direct rendering of secrets in dashboard components.
- No logging of request body, password, cookie, or auth header.
- Service lifecycle actions require confirmation tokens and remain simulation-only.
- Intelligence endpoints are advisory and read-only; recommendations are operator-gated.
- Assistance endpoints are advisory and read-only; workflow suggestions require explicit operator approval.
- Reliability endpoints are advisory and read-only; ledger writes are authenticated and operator-triggered.
- Knowledge graph endpoints are read-only derived views and query surfaces.
- Copilot responses are advisory, evidence-backed, confidence-scored, and cannot perform hidden execution.
- Copilot secret-like queries are blocked and returned as policy warnings.
- Fabric node registration requires explicit token validation and blocks duplicates.
- Fabric heartbeat/telemetry endpoints require node token validation and redact sensitive telemetry keys.
- Fabric query routes are advisory and do not execute remote actions.
- Governance policies and thresholds are configurable but evaluations remain read-only by default.
- Governance violations must include evidence and severity classification.
- Governance remediation guidance is operator-approval-required.
- No write/mutation actions against external repos/services are enabled by this layer.
- Fallback data is never treated as authoritative state.
- Login failures are audit-logged and rate-limited.

## Known Limitations
- Local auth only (no SSO, MFA, RBAC yet).
- Single-operator credential model.
- In-memory rate limits are process-local (no distributed enforcement).

## Next Security Milestones
- Add brute-force protection and login rate limiting.
- Add role model and scoped permissions for future control actions.
- Add secret-provider backed credential rotation workflow.
