import { analyzeServiceTrends } from "../intelligence/serviceTrendAnalyzer.js";
import { getRecentEvents } from "../services/observability.js";
import { detectIncidentPatterns } from "./incidentPatternDetector.js";

function warningsForService(service, events) {
  const serviceName = String(service.service || "").toLowerCase();
  const serviceId = String(service.service_id || "").toLowerCase();

  return events.filter((event) => {
    if (!event || !["warning", "error"].includes(String(event.level || "").toLowerCase())) {
      return false;
    }

    const message = String(event.message || "").toLowerCase();
    const target = String(event.target || "").toLowerCase();
    return message.includes(serviceName) || message.includes(serviceId) || target.includes(serviceId);
  }).length;
}

function reliabilityScore(service, incidentCount, warningCount) {
  let score = Number(service.stability_score || 70);
  score -= Math.min(40, incidentCount * 9);
  score -= Math.min(25, warningCount * 2);

  return Math.max(0, Math.min(100, score));
}

function trendLabel(service, score, incidentCount) {
  if (score < 45 || incidentCount >= 4) {
    return "chronic";
  }

  if (score < 65 || service.health_trend === "degrading") {
    return "degrading";
  }

  if (score > 85 && service.health_trend === "stable") {
    return "stable";
  }

  return "watch";
}

function riskLevel(score) {
  if (score < 45) {
    return "high";
  }

  if (score < 70) {
    return "medium";
  }

  return "low";
}

export function analyzeReliabilityTrends({ forceRefresh = false } = {}) {
  const serviceTrends = analyzeServiceTrends({ forceRefresh });
  const incidents = detectIncidentPatterns({ forceRefresh });
  const events = getRecentEvents({ limit: 1500 });

  const incidentsByService = new Map();
  for (const incident of incidents.items || []) {
    const key = String(incident.service || "");
    incidentsByService.set(key, (incidentsByService.get(key) || 0) + 1);
  }

  const items = (serviceTrends.items || []).map((service) => {
    const incidentCount = incidentsByService.get(service.service) || 0;
    const warningCount = warningsForService(service, events);
    const score = reliabilityScore(service, incidentCount, warningCount);
    const trend = trendLabel(service, score, incidentCount);

    return {
      service: service.service,
      reliability_score: score,
      trend,
      incident_count: incidentCount,
      warning_count: warningCount,
      risk_level: riskLevel(score),
      confidence: Number(Math.min(0.97, Number(service.confidence_score || 0.7) + 0.06).toFixed(2)),
      evidence: [
        `stability_score=${service.stability_score}`,
        `incident_count=${incidentCount}`,
        `warning_count=${warningCount}`,
        `health_trend=${service.health_trend}`
      ]
    };
  });

  const averageScore =
    items.length > 0 ? Number((items.reduce((total, item) => total + item.reliability_score, 0) / items.length).toFixed(2)) : 0;

  const platformTrend = averageScore < 55 ? "degrading" : averageScore < 75 ? "watch" : "stable";

  return {
    generatedAt: new Date().toISOString(),
    mode: "advisory_reliability_trends",
    items,
    summary: {
      total: items.length,
      high: items.filter((item) => item.risk_level === "high").length,
      medium: items.filter((item) => item.risk_level === "medium").length,
      low: items.filter((item) => item.risk_level === "low").length,
      average_score: averageScore,
      platform_trend: platformTrend
    }
  };
}
