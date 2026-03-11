import { analyzeServiceTrends } from "../intelligence/serviceTrendAnalyzer.js";
import { getRecentEvents } from "../services/observability.js";

function toIdSegment(value) {
  return String(value || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36);
}

function countRelatedEvents(service, events) {
  const serviceName = String(service.service || "").toLowerCase();
  const serviceId = String(service.service_id || "").toLowerCase();

  const warningEvents = events.filter((event) => {
    if (!event || !["warning", "error"].includes(String(event.level || "").toLowerCase())) {
      return false;
    }

    const message = String(event.message || "").toLowerCase();
    const target = String(event.target || "").toLowerCase();
    return message.includes(serviceName) || message.includes(serviceId) || target.includes(serviceId);
  });

  const operatorFailures = events.filter((event) => {
    if (event.source !== "operator-action") {
      return false;
    }

    const target = String(event.target || "").toLowerCase();
    const result = String(event.result || "").toLowerCase();
    return target.includes(serviceId) && (result.includes("blocked") || result.includes("not_found"));
  });

  return {
    warningEvents,
    operatorFailures
  };
}

function patternType(service, occurrenceCount, warningCount) {
  if (service.failure_count >= 3) {
    return "recurring_diagnostics_failure";
  }

  if (warningCount >= 5) {
    return "warning_cluster";
  }

  if (service.stability_score < 60 || service.health_trend === "degrading") {
    return "stability_drift";
  }

  if (occurrenceCount >= 3) {
    return "incident_cluster";
  }

  return "watch_pattern";
}

function severityLevel(service, occurrenceCount, warningCount) {
  if (service.stability_score < 45 || occurrenceCount >= 8) {
    return "high";
  }

  if (service.stability_score < 70 || warningCount >= 4 || occurrenceCount >= 4) {
    return "medium";
  }

  return "low";
}

function confidenceScore(service, warningCount, operatorFailures) {
  let confidence = Number(service.confidence_score || 0.6);

  if (warningCount > 0) {
    confidence += 0.08;
  }

  if (operatorFailures > 0) {
    confidence += 0.08;
  }

  if (service.failure_count >= 2) {
    confidence += 0.06;
  }

  return Number(Math.min(0.97, confidence).toFixed(2));
}

export function detectIncidentPatterns({ forceRefresh = false } = {}) {
  const trends = analyzeServiceTrends({ forceRefresh });
  const events = getRecentEvents({ limit: 1500 });

  const items = (trends.items || [])
    .map((service) => {
      const related = countRelatedEvents(service, events);
      const warningCount = related.warningEvents.length;
      const operatorFailureCount = related.operatorFailures.length;
      const occurrenceCount = Number(service.failure_count || 0) + warningCount + operatorFailureCount;
      const type = patternType(service, occurrenceCount, warningCount);
      const severity = severityLevel(service, occurrenceCount, warningCount);

      return {
        incident_id: `inc-${toIdSegment(service.service_id || service.service)}-${toIdSegment(type)}`,
        service: service.service,
        service_id: service.service_id,
        pattern_type: type,
        severity,
        occurrence_count: occurrenceCount,
        evidence: [
          `health_trend=${service.health_trend}`,
          `failure_count=${service.failure_count}`,
          `warning_events=${warningCount}`,
          `operator_failures=${operatorFailureCount}`
        ],
        confidence: confidenceScore(service, warningCount, operatorFailureCount)
      };
    })
    .filter((item) => item.occurrence_count > 0 || item.severity !== "low");

  const summary = {
    total: items.length,
    high: items.filter((item) => item.severity === "high").length,
    medium: items.filter((item) => item.severity === "medium").length,
    low: items.filter((item) => item.severity === "low").length
  };

  return {
    generatedAt: new Date().toISOString(),
    mode: "advisory_reliability",
    items,
    summary
  };
}
