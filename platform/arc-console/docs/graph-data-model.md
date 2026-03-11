# Graph Data Model

## Node Types
- `service`
- `repository`
- `dependency`
- `agent`
- `workflow`
- `incident`
- `playbook`
- `recovery`

Node shape:
- `node_id`
- `node_type`
- `attributes`

## Relationship Types
- `hosted_in`
- `depends_on`
- `affects`
- `resolves`
- `executes`
- `targets`

Relationship shape:
- `source`
- `relationship`
- `target`
- `confidence`
- `evidence`

## Integrity Rules
- Relationship endpoints are retained only when both source and target node ids exist.
- Missing references are reported in graph diagnostics metadata.
- Orphan nodes are allowed and surfaced for operator review.

## Snapshot Shape
- `snapshot_id`
- `captured_at`
- `node_count`
- `relationship_count`
- `metadata`
- `deltas`
