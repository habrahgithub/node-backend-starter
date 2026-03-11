# Graph Query Guide

## Service Query
Endpoint:
- `GET /api/knowledge/query/service/:name`

Returns:
- service node
- hosted repository
- related dependencies
- related incidents
- related workflows
- metadata counts

Use case:
- inspect a service impact chain quickly before approving remediation.

## Repository Query
Endpoint:
- `GET /api/knowledge/query/repository/:name`

Returns:
- repository node
- hosted services
- incidents affecting those services
- workflows targeting those services
- metadata counts

Use case:
- understand cross-service blast radius for repository-level drift.

## Snapshot Query
Endpoint:
- `GET /api/knowledge/snapshots`

Returns:
- latest snapshot
- in-memory snapshot history
- node/relationship deltas

Use case:
- compare graph evolution across refresh windows.

## Safety Notes
- Queries are read-only.
- Missing nodes/relationships return safe empty structures.
- Query results are advisory context, not execution commands.
