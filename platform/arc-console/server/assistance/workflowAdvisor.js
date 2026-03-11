import { getWorkflows } from "../automation/operatorWorkflow.js";
import { generatePlatformInsights } from "../intelligence/platformInsightsEngine.js";

function workflowForDomain(domain) {
  if (domain === "services") {
    return "platform-health-check";
  }

  if (domain === "repositories" || domain === "dependencies") {
    return "repo-audit";
  }

  if (domain === "agents") {
    return "agent-health-check";
  }

  return "system-scan";
}

export function getWorkflowGuidance({ forceRefresh = false } = {}) {
  const insights = generatePlatformInsights({ forceRefresh });
  const workflows = getWorkflows();
  const workflowIds = new Set((workflows.items || []).map((item) => item.id));

  const items = (insights.top_risks || []).map((risk) => {
    const suggested = workflowForDomain(risk.domain);
    const available = workflowIds.has(suggested);

    return {
      workflow: suggested,
      domain: risk.domain,
      trigger_risk: `${risk.subject} (${risk.risk_level})`,
      reason: risk.recommendation || "Risk-triggered recommendation",
      confidence: risk.confidence_score,
      evidence: risk.evidence,
      available,
      status: available ? "suggested" : "needs_review",
      operator_approval_required: true
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    mode: "guided_workflows",
    items,
    summary: {
      total: items.length,
      available: items.filter((item) => item.available).length,
      needsReview: items.filter((item) => !item.available).length
    }
  };
}
