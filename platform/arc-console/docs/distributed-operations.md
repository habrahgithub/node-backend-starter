# Distributed Operations

## Operating Mode
Phase 12 enables multi-node visibility while preserving governance safeguards:
- registration is authenticated
- telemetry is read-only by default
- distributed queries are advisory
- offline nodes are tolerated

## Dashboard Surfaces
- `/fabric`
  - federated telemetry summary
  - distributed query sample output
- `/nodes`
  - node inventory and lookup details
- `/node-topology`
  - control-plane topology graph and capability relationships

## Node Lifecycle Summary
1. Register node metadata.
2. Submit heartbeat updates.
3. Submit telemetry snapshots.
4. Query federated state through fabric endpoints.
5. Review topology for capability and status relationships.

## Failure Handling
- Offline node transitions are signaled through status changes.
- Missing node telemetry does not block fabric endpoint availability.
- Empty-node state returns zeroed summaries and valid response shapes.

## Governance Boundary
Distributed fabric remains read-only and advisory in this phase:
- no remote restarts
- no repository mutations
- no hidden execution from fabric query routes
