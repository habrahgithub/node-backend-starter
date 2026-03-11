# Knowledge Graph Architecture

## Objective
Phase 10 adds a read-only Platform Knowledge Graph that connects services, repositories, dependencies, agents, workflows, incidents, playbooks, and recovery guidance.

## Modules
- `server/knowledge/nodeRegistry.js`
  - derives normalized graph nodes from existing system outputs
- `server/knowledge/relationshipMapper.js`
  - derives confidence-scored edges between nodes
- `server/knowledge/graphBuilder.js`
  - assembles and validates graph integrity
- `server/knowledge/graphQueryEngine.js`
  - lightweight service/repository impact queries
- `server/knowledge/graphSnapshotStore.js`
  - in-memory snapshot history for trend comparison

## API Surface
Protected routes:
- `GET /api/knowledge/nodes`
- `GET /api/knowledge/relationships`
- `GET /api/knowledge/graph`
- `GET /api/knowledge/query/service/:name`
- `GET /api/knowledge/query/repository/:name`
- `GET /api/knowledge/snapshots`

## Data Source Policy
- Graph is derived from existing ARC modules (automation/intelligence/assistance/reliability).
- No direct mutation of repositories/services/dependencies.
- Missing relationships are tolerated and surfaced in diagnostics metadata.

## Observability
Knowledge graph routes emit:
- `KNOWLEDGE_GRAPH_BUILT`
- `KNOWLEDGE_GRAPH_QUERY`
- `KNOWLEDGE_GRAPH_SNAPSHOT`

## Runtime Characteristics
- Lightweight query paths intended for dashboard rendering.
- Safe empty-state behavior when source modules return sparse data.
- Snapshot history stored in-memory with bounded retention.
