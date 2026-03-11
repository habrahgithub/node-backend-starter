import { getFabricTelemetry } from "./nodeTelemetryAggregator.js";

function classifyFabricQuery(query) {
  const text = String(query || "").toLowerCase();

  if (text.includes("service")) {
    return "service_status";
  }
  if (text.includes("metric") || text.includes("telemetry")) {
    return "telemetry_metrics";
  }
  if (text.includes("repo") || text.includes("repository")) {
    return "repository_status";
  }
  if (text.includes("offline") || text.includes("node")) {
    return "node_health";
  }

  return "fabric_summary";
}

function summarizeMetrics(metrics) {
  const cpu = Number(metrics?.cpu ?? metrics?.cpu_percent ?? 0);
  const memory = Number(metrics?.memory ?? metrics?.memory_percent ?? 0);
  const disk = Number(metrics?.disk ?? metrics?.disk_percent ?? 0);

  return {
    cpu: Number.isFinite(cpu) ? cpu : 0,
    memory: Number.isFinite(memory) ? memory : 0,
    disk: Number.isFinite(disk) ? disk : 0
  };
}

export function routeFabricQuery({ query, nodeId = "" }) {
  const telemetry = getFabricTelemetry();
  const queryType = classifyFabricQuery(query);
  const requestedNodeId = String(nodeId || "").trim().toLowerCase();

  const targetItems = requestedNodeId
    ? telemetry.items.filter((item) => item.node_id === requestedNodeId)
    : telemetry.items;

  const warnings = [];
  if (targetItems.length === 0) {
    warnings.push(requestedNodeId ? "Requested node is not registered." : "No nodes are currently registered.");
  }

  let results = [];

  if (queryType === "service_status") {
    results = targetItems.map((item) => ({
      node_id: item.node_id,
      status: item.status,
      services_total: item.services_total,
      services_degraded: item.services_degraded,
      warning_count: item.warning_count
    }));
  } else if (queryType === "telemetry_metrics") {
    results = targetItems.map((item) => ({
      node_id: item.node_id,
      status: item.status,
      ...summarizeMetrics(item.metrics)
    }));
  } else if (queryType === "repository_status") {
    results = targetItems.map((item) => ({
      node_id: item.node_id,
      status: item.status,
      repositories_total: item.repositories_total,
      warning_count: item.warning_count
    }));
  } else if (queryType === "node_health") {
    results = targetItems.map((item) => ({
      node_id: item.node_id,
      status: item.status,
      last_seen: item.last_seen,
      telemetry_at: item.telemetry_at
    }));
  } else {
    results = [
      {
        nodes_total: telemetry.summary.nodes_total,
        nodes_online: telemetry.summary.nodes_online,
        nodes_degraded: telemetry.summary.nodes_degraded,
        nodes_offline: telemetry.summary.nodes_offline,
        nodes_reporting: telemetry.summary.nodes_reporting,
        services_total: telemetry.summary.services_total,
        services_degraded: telemetry.summary.services_degraded
      }
    ];
  }

  return {
    generatedAt: new Date().toISOString(),
    mode: "advisory_read_only",
    query: String(query || ""),
    query_type: queryType,
    action_mode: "informational",
    target: requestedNodeId || "all_nodes",
    results,
    summary: {
      result_count: results.length,
      targeted_nodes: targetItems.length,
      offline_nodes: targetItems.filter((item) => item.status === "offline").length
    },
    evidence_sources: ["fabric_node_registry", "fabric_telemetry_store"],
    warnings
  };
}
