import { generatePlatformInsights } from "../intelligence/platformInsightsEngine.js";

function guidanceLevel(riskLevel) {
  if (riskLevel === "high" || riskLevel === "critical") {
    return "urgent";
  }

  if (riskLevel === "medium") {
    return "attention";
  }

  return "monitor";
}

export function getAssistedInsights({ forceRefresh = false } = {}) {
  const insights = generatePlatformInsights({ forceRefresh });

  const guidance = (insights.top_risks || []).map((risk) => ({
    risk: `${risk.domain}:${risk.subject}`,
    severity: guidanceLevel(risk.risk_level),
    recommended_action: risk.recommendation || "Run operator review workflow.",
    confidence: Number(risk.confidence_score || 0),
    evidence: risk.evidence || [],
    evidence_links: insights.evidence_links || [],
    operator_approval_required: true
  }));

  return {
    generatedAt: new Date().toISOString(),
    mode: "advisory_copilot",
    items: guidance,
    summary: {
      total: guidance.length,
      urgent: guidance.filter((item) => item.severity === "urgent").length,
      attention: guidance.filter((item) => item.severity === "attention").length,
      monitor: guidance.filter((item) => item.severity === "monitor").length
    }
  };
}
