import { analyzeServiceTrends } from "../intelligence/serviceTrendAnalyzer.js";

function buildDiagnosticSteps(service) {
  return [
    `Validate latest service health payload for ${service.service}.`,
    "Review recent operator-action and intelligence logs for repeated failures.",
    "Run operator-approved service diagnostics simulation.",
    "Review dependency and repo drift findings before remediation.",
    "Escalate to governed remediation backlog if instability persists."
  ];
}

export function getServiceDiagnosticGuidance({ forceRefresh = false } = {}) {
  const trends = analyzeServiceTrends({ forceRefresh });
  const unstable = (trends.items || []).filter(
    (item) => item.health_trend === "degrading" || item.health_trend === "unstable" || item.stability_score < 70
  );

  const source = unstable.length > 0 ? unstable : (trends.items || []).slice(0, 8);

  const items = source.map((service) => ({
    service: service.service,
    issue: `trend=${service.health_trend}, stability=${service.stability_score}`,
    diagnostic_steps: buildDiagnosticSteps(service),
    recommended_workflow: "platform-health-check",
    confidence: service.confidence_score,
    evidence: service.evidence,
    operator_approval_required: true
  }));

  return {
    generatedAt: new Date().toISOString(),
    mode: "guided_diagnostics",
    items,
    summary: {
      total: items.length,
      unstableServices: unstable.length,
      averageConfidence:
        items.length > 0 ? Number((items.reduce((total, item) => total + Number(item.confidence || 0), 0) / items.length).toFixed(2)) : 0
    }
  };
}
