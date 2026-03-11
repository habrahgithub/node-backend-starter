import { getServiceDiagnosticGuidance } from "../assistance/diagnosticCopilot.js";
import { getAssistedInsights } from "../assistance/insightInterpreter.js";
import { getOperatorAlerts } from "../assistance/operatorNotifier.js";
import { getRepositoryCleanupAdvice } from "../assistance/repoCleanupAdvisor.js";
import { getWorkflowGuidance } from "../assistance/workflowAdvisor.js";
import { recordAssistanceEvent } from "../services/observability.js";

function emitAssistanceSummary(domain, payload) {
  recordAssistanceEvent({
    eventType: "ASSISTANCE_RECOMMENDATION",
    severity: "info",
    title: `${domain} assistance generated`,
    message: JSON.stringify(payload.summary || {}),
    domain,
    confidenceScore: 0.8,
    evidence: [`items=${(payload.items || []).length}`]
  });
}

export function getAssistanceInsightsController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = getAssistedInsights({ forceRefresh });

    emitAssistanceSummary("insights", payload);

    for (const item of (payload.items || []).slice(0, 8)) {
      recordAssistanceEvent({
        eventType: "ASSISTANCE_RECOMMENDATION",
        severity: item.severity,
        title: item.risk,
        message: item.recommended_action,
        domain: "insights",
        confidenceScore: item.confidence,
        evidence: item.evidence
      });
    }

    res.json(payload);
  } catch (error) {
    res.status(503).json({
      error: "assistance_insights_unavailable",
      message: "Assistance insight interpretation is unavailable.",
      details: error.message
    });
  }
}

export function getAssistanceServiceDiagnosticsController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = getServiceDiagnosticGuidance({ forceRefresh });

    emitAssistanceSummary("diagnostics", payload);

    for (const item of (payload.items || []).slice(0, 8)) {
      recordAssistanceEvent({
        eventType: "ASSISTANCE_RECOMMENDATION",
        severity: String(item.issue || "").includes("degrading") ? "urgent" : "attention",
        title: item.service,
        message: item.issue,
        domain: "diagnostics",
        confidenceScore: item.confidence,
        evidence: item.evidence
      });
    }

    res.json(payload);
  } catch (error) {
    res.status(503).json({
      error: "assistance_service_diagnostics_unavailable",
      message: "Service diagnostic copilot is unavailable.",
      details: error.message
    });
  }
}

export function getAssistanceRepoAdviceController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = getRepositoryCleanupAdvice({ forceRefresh });

    emitAssistanceSummary("repo-advice", payload);

    for (const item of (payload.items || []).slice(0, 8)) {
      recordAssistanceEvent({
        eventType: "ASSISTANCE_RECOMMENDATION",
        severity: item.risk_level,
        title: item.repository,
        message: item.suggested_cleanup,
        domain: "repo-advice",
        confidenceScore: item.confidence,
        evidence: item.evidence
      });
    }

    res.json(payload);
  } catch (error) {
    res.status(503).json({
      error: "assistance_repo_advice_unavailable",
      message: "Repository cleanup advisor is unavailable.",
      details: error.message
    });
  }
}

export function getAssistanceWorkflowsController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = getWorkflowGuidance({ forceRefresh });

    recordAssistanceEvent({
      eventType: "ASSISTANCE_WORKFLOW_SUGGESTION",
      severity: "info",
      title: "workflow guidance generated",
      message: JSON.stringify(payload.summary || {}),
      domain: "workflows",
      confidenceScore: 0.8,
      evidence: [`items=${(payload.items || []).length}`]
    });

    for (const item of (payload.items || []).slice(0, 8)) {
      recordAssistanceEvent({
        eventType: "ASSISTANCE_WORKFLOW_SUGGESTION",
        severity: item.status === "needs_review" ? "attention" : "info",
        title: item.workflow,
        message: item.reason,
        domain: "workflows",
        confidenceScore: item.confidence,
        evidence: item.evidence
      });
    }

    res.json(payload);
  } catch (error) {
    res.status(503).json({
      error: "assistance_workflows_unavailable",
      message: "Workflow advisor is unavailable.",
      details: error.message
    });
  }
}

export function getAssistanceAlertsController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = getOperatorAlerts({ forceRefresh });

    recordAssistanceEvent({
      eventType: "ASSISTANCE_ALERT",
      severity: payload.summary?.urgent > 0 ? "urgent" : "info",
      title: "operator alert summary generated",
      message: JSON.stringify(payload.summary || {}),
      domain: "alerts",
      confidenceScore: 0.8,
      evidence: [`urgent=${payload.summary?.urgent || 0}`]
    });

    for (const item of (payload.items || []).slice(0, 10)) {
      recordAssistanceEvent({
        eventType: "ASSISTANCE_ALERT",
        severity: item.level,
        title: item.title,
        message: item.summary,
        domain: item.category,
        confidenceScore: item.confidence,
        evidence: item.evidence
      });
    }

    res.json(payload);
  } catch (error) {
    res.status(503).json({
      error: "assistance_alerts_unavailable",
      message: "Operator notifier is unavailable.",
      details: error.message
    });
  }
}
