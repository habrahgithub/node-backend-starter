# Fabric Architecture

## Objective
Phase 12 introduces a distributed control fabric so ARC can register and monitor multiple managed nodes while preserving a unified control-plane dashboard.

## Module Topology
- `server/fabric/nodeRegistry.js`
  - local node metadata store
  - duplicate prevention
  - registration token validation
- `server/fabric/nodeHeartbeatMonitor.js`
  - heartbeat status tracking
  - online/degraded/offline signal transitions
- `server/fabric/nodeTelemetryAggregator.js`
  - node telemetry ingest
  - federated read-only health aggregation
  - sensitive key redaction
- `server/fabric/nodeQueryRouter.js`
  - distributed query classification and aggregation
  - advisory query responses only
- `server/fabric/fabricTopologyMap.js`
  - control-plane-to-node topology graph
  - capability relationship mapping

## API Surface
Protected endpoints:
- `POST /api/fabric/nodes/register`
- `GET /api/fabric/nodes`
- `GET /api/fabric/nodes/:id`
- `POST /api/fabric/nodes/:id/heartbeat`
- `POST /api/fabric/nodes/:id/telemetry`
- `GET /api/fabric/telemetry`
- `POST /api/fabric/query`
- `GET /api/fabric/topology`

## Design Guarantees
- Authenticated access is mandatory.
- Remote telemetry remains read-only by default.
- Offline nodes are tolerated and surfaced as status signals.
- Node metadata and telemetry are persisted locally under ARC data storage.
- No remote execution path is enabled by distributed fabric queries.
