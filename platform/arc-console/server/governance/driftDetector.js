import { getRepositoryHealth } from "../automation/repoGovernor.js";
import { getServices } from "../services/systemRegistry.js";
import { listFabricNodes } from "../fabric/nodeRegistry.js";
import { getFabricTelemetry } from "../fabric/nodeTelemetryAggregator.js";

function buildDrift(component, driftType, severity, evidence, recommendedAction, confidence = 0.8) {
  return {
    component,
    drift_type: driftType,
    severity,
    evidence,
    confidence: Number(Number(confidence).toFixed(2)),
    recommended_action: recommendedAction,
    operator_approval_required: true
  };
}

export function detectGovernanceDrift({ forceRefresh = false } = {}) {
  const nodes = listFabricNodes({ forceRefresh });
  const telemetry = getFabricTelemetry({ forceRefresh });
  const services = getServices({ forceRefresh });
  const repoHealth = getRepositoryHealth({ forceRefresh });

  const items = [];

  for (const node of nodes.items || []) {
    if (node.status === "offline") {
      items.push(
        buildDrift(
          `node:${node.node_id}`,
          "node_offline",
          "high",
          [`last_seen=${node.last_seen || "unknown"}`],
          "Validate node connectivity and approve node recovery procedure.",
          0.9
        )
      );
      continue;
    }

    if (node.status === "degraded") {
      items.push(
        buildDrift(
          `node:${node.node_id}`,
          "node_degraded",
          "medium",
          [`last_seen=${node.last_seen || "unknown"}`],
          "Review heartbeat latency and approve node stabilization checks.",
          0.84
        )
      );
    }

    if ((node.capabilities || []).length === 0) {
      items.push(
        buildDrift(
          `node:${node.node_id}`,
          "capability_gap",
          "low",
          ["capabilities=none"],
          "Review node capability profile and update registration metadata.",
          0.74
        )
      );
    }
  }

  for (const entry of telemetry.items || []) {
    if (entry.status === "online" && !entry.telemetry_at) {
      items.push(
        buildDrift(
          `node:${entry.node_id}`,
          "missing_telemetry_snapshot",
          "medium",
          [`status=${entry.status}`, "telemetry_at=none"],
          "Confirm node telemetry pipeline and approve telemetry refresh.",
          0.79
        )
      );
    }

    if (Number(entry.services_degraded || 0) > 0) {
      items.push(
        buildDrift(
          `node:${entry.node_id}`,
          "service_inconsistency",
          "medium",
          [`services_degraded=${entry.services_degraded}`, `warning_count=${entry.warning_count}`],
          "Run service diagnostics for affected node and review governed remediation.",
          0.83
        )
      );
    }
  }

  const criticalRepos = Number(repoHealth.summary?.critical || 0);
  if (criticalRepos > 0) {
    items.push(
      buildDrift(
        "repositories",
        "repo_health_critical",
        "high",
        [`critical_repositories=${criticalRepos}`],
        "Run repository governance remediation workflow for critical repositories.",
        0.86
      )
    );
  }

  const federatedServices = Number(telemetry.summary?.services_total || 0);
  if (services.length > 0 && federatedServices === 0 && nodes.summary.total > 0) {
    items.push(
      buildDrift(
        "services",
        "federated_service_visibility_gap",
        "medium",
        [`local_services=${services.length}`, `federated_services=${federatedServices}`],
        "Review distributed telemetry coverage and onboard missing service nodes.",
        0.77
      )
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    mode: "advisory_read_only",
    items,
    summary: {
      total: items.length,
      high: items.filter((item) => item.severity === "high").length,
      medium: items.filter((item) => item.severity === "medium").length,
      low: items.filter((item) => item.severity === "low").length
    }
  };
}
