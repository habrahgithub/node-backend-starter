import { getServiceDiagnosticGuidance } from "./diagnosticCopilot.js";
import { getAssistedInsights } from "./insightInterpreter.js";
import { getRepositoryCleanupAdvice } from "./repoCleanupAdvisor.js";
import { getWorkflowGuidance } from "./workflowAdvisor.js";

function severityScore(level) {
  if (level === "urgent") {
    return 3;
  }

  if (level === "attention") {
    return 2;
  }

  return 1;
}

export function getOperatorAlerts({ forceRefresh = false } = {}) {
  const insights = getAssistedInsights({ forceRefresh });
  const diagnostics = getServiceDiagnosticGuidance({ forceRefresh });
  const repoAdvice = getRepositoryCleanupAdvice({ forceRefresh });
  const workflows = getWorkflowGuidance({ forceRefresh });

  const alerts = [];

  for (const item of insights.items || []) {
    alerts.push({
      category: "insight",
      level: item.severity,
      title: item.risk,
      summary: item.recommended_action,
      next_action: "Review insight and approve next workflow if needed.",
      confidence: item.confidence,
      evidence: item.evidence,
      operator_approval_required: true
    });
  }

  for (const item of (diagnostics.items || []).slice(0, 8)) {
    alerts.push({
      category: "diagnostic",
      level: String(item.issue || "").includes("degrading") ? "urgent" : "attention",
      title: item.service,
      summary: item.issue,
      next_action: item.recommended_workflow,
      confidence: item.confidence,
      evidence: item.evidence,
      operator_approval_required: true
    });
  }

  for (const item of (repoAdvice.items || []).slice(0, 8)) {
    alerts.push({
      category: "repository",
      level: item.risk_level === "high" ? "urgent" : "attention",
      title: item.repository,
      summary: item.suggested_cleanup,
      next_action: item.recommended_workflow,
      confidence: item.confidence,
      evidence: item.evidence,
      operator_approval_required: true
    });
  }

  for (const item of (workflows.items || []).slice(0, 8)) {
    alerts.push({
      category: "workflow",
      level: item.status === "needs_review" ? "attention" : "monitor",
      title: item.workflow,
      summary: item.reason,
      next_action: item.status === "needs_review" ? "Validate workflow mapping with operator." : "Approve workflow suggestion.",
      confidence: item.confidence,
      evidence: item.evidence,
      operator_approval_required: true
    });
  }

  alerts.sort((a, b) => severityScore(b.level) - severityScore(a.level));

  return {
    generatedAt: new Date().toISOString(),
    mode: "operator_notifications",
    items: alerts.slice(0, 40),
    summary: {
      total: alerts.length,
      urgent: alerts.filter((item) => item.level === "urgent").length,
      attention: alerts.filter((item) => item.level === "attention").length,
      monitor: alerts.filter((item) => item.level === "monitor").length
    }
  };
}
