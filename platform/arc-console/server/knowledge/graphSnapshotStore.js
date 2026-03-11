import { buildKnowledgeGraph } from "./graphBuilder.js";

const SNAPSHOT_TTL_MS = 60 * 1000;
const MAX_SNAPSHOTS = 40;
const snapshots = [];

function makeSnapshot(graph) {
  const previous = snapshots[0] || null;

  const next = {
    snapshot_id: `graph-${Date.now()}`,
    captured_at: new Date().toISOString(),
    node_count: graph.metadata?.node_count ?? 0,
    relationship_count: graph.metadata?.relationship_count ?? 0,
    metadata: graph.metadata,
    deltas: previous
      ? {
          node_delta: (graph.metadata?.node_count ?? 0) - Number(previous.node_count || 0),
          relationship_delta: (graph.metadata?.relationship_count ?? 0) - Number(previous.relationship_count || 0)
        }
      : {
          node_delta: 0,
          relationship_delta: 0
        }
  };

  snapshots.unshift(next);
  if (snapshots.length > MAX_SNAPSHOTS) {
    snapshots.splice(MAX_SNAPSHOTS);
  }

  return next;
}

function latestSnapshotIsFresh() {
  const latest = snapshots[0];
  if (!latest) {
    return false;
  }

  const ageMs = Date.now() - new Date(latest.captured_at).getTime();
  return Number.isFinite(ageMs) && ageMs < SNAPSHOT_TTL_MS;
}

export function buildAndStoreGraphSnapshot({ forceRefresh = false } = {}) {
  if (!forceRefresh && latestSnapshotIsFresh()) {
    return snapshots[0];
  }

  const graph = buildKnowledgeGraph({ forceRefresh });
  return makeSnapshot(graph);
}

export function getGraphSnapshots({ forceRefresh = false } = {}) {
  const latest = buildAndStoreGraphSnapshot({ forceRefresh });

  return {
    generatedAt: new Date().toISOString(),
    mode: "in_memory_snapshot_history",
    latest,
    items: snapshots
  };
}
