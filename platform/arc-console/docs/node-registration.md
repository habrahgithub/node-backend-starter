# Node Registration

## Registration Contract
Route:
- `POST /api/fabric/nodes/register`

Required payload fields:
- `node_id`
- `node_type`
- `hostname`
- `token`

Optional payload fields:
- `capabilities[]`

## Registration Controls
- Route requires authenticated operator session.
- Registration token must match `FABRIC_NODE_REGISTRATION_TOKEN`.
- Duplicate `node_id` registration is blocked (`409`).
- Stored metadata excludes token material; only token hash is retained internally.

## Node Metadata Model
Stored and exposed fields:
- `node_id`
- `node_type`
- `hostname`
- `capabilities`
- `status`
- `last_seen`
- `registered_at`
- `updated_at`

## Heartbeat and Telemetry Authentication
`POST /api/fabric/nodes/:id/heartbeat` and `POST /api/fabric/nodes/:id/telemetry` require node token:
- body: `token`
- or header: `x-fabric-node-token`

Invalid token responses:
- `403` unauthorized

Missing node responses:
- `404` not found
