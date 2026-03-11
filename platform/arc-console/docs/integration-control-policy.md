# Integration Control Policy

## Principle
All integration adapters in this phase are read-only. No external mutation is permitted.

## Implemented Adapters

### Repository inventory refresh
- Endpoint: `POST /api/integrations/repo-inventory/refresh`
- Behavior: forces local registry refresh and returns repository summary.
- Mutation scope: none.

### Artifact signal refresh
- Endpoint: `POST /api/integrations/artifacts/refresh`
- Behavior: reads timestamp/existence metadata for governance artifacts.
- Mutation scope: none.

### Optional agent-state adapter
- Endpoint: `GET /api/integrations/agent-state`
- Sources:
  - optional endpoint (`AGENT_STATE_ENDPOINT`)
  - fallback registry/file source
- Mutation scope: none.

### Optional service-heartbeat adapter
- Endpoint: `GET /api/integrations/service-heartbeat`
- Sources:
  - optional endpoint (`SERVICE_HEARTBEAT_ENDPOINT`)
  - fallback registry source
- Mutation scope: none.

## Access Control
- All integration endpoints require authenticated operator session.
- Unauthorized requests return `401`.

## Data Handling Rules
- Do not return secret values in responses.
- Endpoint failures return structured non-fatal error payloads.
- Adapter fallback state must be clearly labeled by `source`.

## Governance Requirements
- Any future write-capable adapter requires explicit Prime approval.
- Any adapter promoting control actions must include:
  - approval model
  - audit event emission
  - rollback expectations
