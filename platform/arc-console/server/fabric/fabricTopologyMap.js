import { listFabricNodes } from "./nodeRegistry.js";
import { getFabricTelemetry } from "./nodeTelemetryAggregator.js";

function capabilityNodeId(capability) {
  return `capability:${String(capability || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9._:-]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

export function getFabricTopologyMap() {
  const nodesPayload = listFabricNodes();
  const telemetryPayload = getFabricTelemetry();

  const graphNodes = [
    {
      id: "control:arc-console",
      type: "control-plane",
      label: "ARC Console",
      status: "online"
    }
  ];

  const graphRelationships = [];
  const capabilityIds = new Set();

  for (const node of nodesPayload.items) {
    graphNodes.push({
      id: `node:${node.node_id}`,
      type: node.node_type,
      label: node.hostname,
      status: node.status,
      last_seen: node.last_seen,
      capabilities: node.capabilities
    });

    graphRelationships.push({
      source: "control:arc-console",
      relationship: "manages",
      target: `node:${node.node_id}`,
      confidence: 1
    });

    for (const capability of node.capabilities || []) {
      const capabilityId = capabilityNodeId(capability);
      if (!capabilityIds.has(capabilityId)) {
        capabilityIds.add(capabilityId);
        graphNodes.push({
          id: capabilityId,
          type: "capability",
          label: capability,
          status: "declared"
        });
      }

      graphRelationships.push({
        source: `node:${node.node_id}`,
        relationship: "supports",
        target: capabilityId,
        confidence: 0.92
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    mode: "derived_read_only",
    nodes: graphNodes,
    relationships: graphRelationships,
    summary: {
      node_count: graphNodes.length,
      relationship_count: graphRelationships.length,
      managed_nodes: nodesPayload.summary.total,
      nodes_online: telemetryPayload.summary.nodes_online,
      nodes_degraded: telemetryPayload.summary.nodes_degraded,
      nodes_offline: telemetryPayload.summary.nodes_offline
    }
  };
}
