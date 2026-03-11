import assert from "node:assert/strict";
import test from "node:test";
import { buildKnowledgeGraph } from "../server/knowledge/graphBuilder.js";
import { queryKnowledgeByRepository, queryKnowledgeByService } from "../server/knowledge/graphQueryEngine.js";
import { getGraphSnapshots } from "../server/knowledge/graphSnapshotStore.js";
import { getKnowledgeNodes } from "../server/knowledge/nodeRegistry.js";
import { mapKnowledgeRelationships } from "../server/knowledge/relationshipMapper.js";

test("knowledge node registry returns typed nodes", () => {
  const payload = getKnowledgeNodes();

  assert.ok(Array.isArray(payload.items));
  if (payload.items.length > 0) {
    const first = payload.items[0];
    assert.equal(typeof first.node_id, "string");
    assert.equal(typeof first.node_type, "string");
    assert.equal(typeof first.attributes, "object");
  }
});

test("relationship mapper returns confidence-scored edges", () => {
  const payload = mapKnowledgeRelationships();

  assert.ok(Array.isArray(payload.items));
  if (payload.items.length > 0) {
    const first = payload.items[0];
    assert.equal(typeof first.source, "string");
    assert.equal(typeof first.relationship, "string");
    assert.equal(typeof first.target, "string");
    assert.equal(typeof first.confidence, "number");
  }
});

test("graph builder creates metadata and diagnostics", () => {
  const payload = buildKnowledgeGraph();

  assert.ok(Array.isArray(payload.nodes));
  assert.ok(Array.isArray(payload.relationships));
  assert.equal(typeof payload.metadata.node_count, "number");
  assert.equal(typeof payload.metadata.relationship_count, "number");
  assert.ok(Array.isArray(payload.diagnostics.orphan_nodes));
});

test("service query returns safe shape", () => {
  const payload = queryKnowledgeByService("swd-pulse");

  assert.equal(typeof payload.found, "boolean");
  assert.ok(Array.isArray(payload.dependencies));
  assert.ok(Array.isArray(payload.incidents));
  assert.ok(Array.isArray(payload.workflows));
});

test("repository query returns safe shape", () => {
  const payload = queryKnowledgeByRepository("Workspace Root");

  assert.equal(typeof payload.found, "boolean");
  assert.ok(Array.isArray(payload.services));
  assert.ok(Array.isArray(payload.incidents));
  assert.ok(Array.isArray(payload.workflows));
});

test("snapshot store returns timestamped history", () => {
  const payload = getGraphSnapshots({ forceRefresh: true });

  assert.equal(typeof payload.latest.snapshot_id, "string");
  assert.equal(typeof payload.latest.captured_at, "string");
  assert.ok(Array.isArray(payload.items));
});
