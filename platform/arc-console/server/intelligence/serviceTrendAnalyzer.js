import { getServiceMetrics } from "../automation/serviceController.js";
import { getRecentEvents } from "../services/observability.js";

function normalizeResultLevel(result) {
  const normalized = String(result || "").toLowerCase();
  if (normalized.includes("blocked") || normalized.includes("not_found")) {
    return "failure";
  }

  if (normalized.includes("completed") || normalized.includes("queued")) {
    return "success";
  }

  return "unknown";
}

function computeFailureCount(serviceId, events) {
  return events.filter((item) => {
    if (item.source !== "operator-action") {
      return false;
    }

    if (!String(item.target || "").includes(serviceId)) {
      return false;
    }

    return normalizeResultLevel(item.result) === "failure";
  }).length;
}

function classifyTrend(service, failureCount) {
  if (service.status !== "operational" && failureCount >= 2) {
    return "degrading";
  }

  if (service.status !== "operational") {
    return "watch";
  }

  if (failureCount >= 3) {
    return "unstable";
  }

  if (failureCount === 0) {
    return "stable";
  }

  return "fluctuating";
}

function stabilityScore(service, failureCount) {
  let score = 100;

  if (service.status !== "operational") {
    score -= 25;
  }

  score -= Math.min(40, failureCount * 12);
  score -= Math.min(20, Number(service.warningCount || 0) * 5);
  score -= Number(service.lastLatencyMs || 0) > 2500 ? 10 : 0;

  return Math.max(0, Math.min(100, score));
}

function confidenceForService(service, failureCount) {
  let confidence = 0.62;

  if (service.executionReadiness && service.executionReadiness !== "NEEDS_REVIEW") {
    confidence += 0.12;
  }

  if (service.status) {
    confidence += 0.1;
  }

  if (failureCount > 0) {
    confidence += 0.08;
  }

  if (Number(service.lastLatencyMs || 0) > 0) {
    confidence += 0.08;
  }

  return Number(Math.min(0.97, confidence).toFixed(2));
}

export function analyzeServiceTrends({ forceRefresh = false } = {}) {
  const metrics = getServiceMetrics({ forceRefresh });
  const events = getRecentEvents({ limit: 1000 });

  const items = (metrics.items || []).map((service) => {
    const failureCount = computeFailureCount(service.id, events);
    const trend = classifyTrend(service, failureCount);
    const score = stabilityScore(service, failureCount);
    const confidence = confidenceForService(service, failureCount);

    return {
      service: service.name,
      service_id: service.id,
      health_trend: trend,
      failure_count: failureCount,
      stability_score: score,
      confidence_score: confidence,
      evidence: [
        `service_status=${service.status}`,
        `execution_readiness=${service.executionReadiness}`,
        `warning_count=${service.warningCount ?? 0}`,
        `recent_failure_events=${failureCount}`
      ],
      recommended_action: {
        text:
          score < 60
            ? "Run operator-approved diagnostics workflow and review dependency/governance signals."
            : "Continue monitoring service trend in intelligence dashboard.",
        operator_approval_required: true
      }
    };
  });

  const alerts = items
    .filter((item) => item.stability_score < 60 || item.health_trend === "degrading" || item.failure_count >= 3)
    .map((item) => ({
      severity: item.stability_score < 45 ? "high" : "medium",
      title: `Service trend alert: ${item.service}`,
      message: `${item.service} has trend ${item.health_trend} with stability ${item.stability_score}.`,
      evidence: item.evidence,
      confidence_score: item.confidence_score
    }));

  return {
    generatedAt: new Date().toISOString(),
    mode: "advisory_read_only",
    items,
    alerts,
    summary: {
      total: items.length,
      unstable: items.filter((item) => item.health_trend === "unstable" || item.health_trend === "degrading").length,
      averageStability:
        items.length > 0
          ? Number((items.reduce((total, item) => total + item.stability_score, 0) / items.length).toFixed(2))
          : 0
    }
  };
}
