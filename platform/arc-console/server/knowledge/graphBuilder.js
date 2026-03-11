import { getKnowledgeNodes } from "./nodeRegistry.js";
import { mapKnowledgeRelationships } from "./relationshipMapper.js";

function summarizeNodeTypes(nodes) {
  const counts = new Map();
  for (const node of nodes) {
    const key = String(node.node_type || "unknown");
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return Object.fromEntries(Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0])));
}

function summarizeRelationshipTypes(relationships) {
  const counts = new Map();
  for (const edge of relationships) {
    const key = String(edge.relationship || "unknown");
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return Object.fromEntries(Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0])));
}

export function buildKnowledgeGraph({ forceRefresh = false } = {}) {
  const nodePayload = getKnowledgeNodes({ forceRefresh });
  const relationshipPayload = mapKnowledgeRelationships({ forceRefresh });

  const nodes = nodePayload.items || [];
  const edges = relationshipPayload.items || [];

  const nodeIds = new Set(nodes.map((node) => node.node_id));
  const validRelationships = [];
  const missingReferences = [];

  for (const edge of edges) {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      validRelationships.push(edge);
      continue;
    }

    missingReferences.push({
      source: edge.source,
      target: edge.target,
      relationship: edge.relationship
    });
  }

  const connectedNodes = new Set();
  for (const edge of validRelationships) {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  }

  const orphanNodes = nodes.filter((node) => !connectedNodes.has(node.node_id)).map((node) => node.node_id);

  return {
    generatedAt: new Date().toISOString(),
    nodes,
    relationships: validRelationships,
    metadata: {
      node_count: nodes.length,
      relationship_count: validRelationships.length,
      orphan_node_count: orphanNodes.length,
      missing_reference_count: missingReferences.length,
      node_types: summarizeNodeTypes(nodes),
      relationship_types: summarizeRelationshipTypes(validRelationships)
    },
    diagnostics: {
      orphan_nodes: orphanNodes.slice(0, 50),
      missing_references: missingReferences.slice(0, 50)
    }
  };
}
