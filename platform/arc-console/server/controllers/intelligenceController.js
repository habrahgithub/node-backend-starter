import { analyzeAgentActivity } from "../intelligence/agentActivityAnalyzer.js";
import { analyzeDependencyRisk } from "../intelligence/dependencyRiskAnalyzer.js";
import { generatePlatformInsights } from "../intelligence/platformInsightsEngine.js";
import { analyzeRepositoryDrift } from "../intelligence/repoDriftDetector.js";
import { analyzeServiceTrends } from "../intelligence/serviceTrendAnalyzer.js";
import { recordIntelligenceEvent } from "../services/observability.js";

function emitIntelligenceEvents({ domain, summary, alerts = [] }) {
  recordIntelligenceEvent({
    eventType: "INTELLIGENCE_SUMMARY",
    severity: "info",
    title: `${domain} intelligence summary`,
    message: JSON.stringify(summary),
    domain,
    confidenceScore: 0.8,
    evidence: [`summary_keys=${Object.keys(summary || {}).join(",")}`]
  });

  for (const alert of alerts.slice(0, 10)) {
    recordIntelligenceEvent({
      eventType: "INTELLIGENCE_ALERT",
      severity: alert.severity || "medium",
      title: alert.title,
      message: alert.message,
      domain,
      confidenceScore: alert.confidence_score ?? 0.7,
      evidence: alert.evidence || []
    });
  }
}

export function getServiceTrendsController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = analyzeServiceTrends({ forceRefresh });

    emitIntelligenceEvents({
      domain: "services",
      summary: payload.summary,
      alerts: payload.alerts
    });

    res.json(payload);
  } catch (error) {
    res.status(503).json({
      error: "intelligence_service_trends_unavailable",
      message: "Service trend intelligence is unavailable.",
      details: error.message
    });
  }
}

export function getRepoDriftController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = analyzeRepositoryDrift({ forceRefresh });

    emitIntelligenceEvents({
      domain: "repositories",
      summary: payload.summary,
      alerts: payload.alerts
    });

    res.json(payload);
  } catch (error) {
    res.status(503).json({
      error: "intelligence_repo_drift_unavailable",
      message: "Repository drift intelligence is unavailable.",
      details: error.message
    });
  }
}

export function getDependencyRiskIntelligenceController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = analyzeDependencyRisk({ forceRefresh });

    emitIntelligenceEvents({
      domain: "dependencies",
      summary: payload.summary,
      alerts: payload.alerts
    });

    res.json(payload);
  } catch (error) {
    res.status(503).json({
      error: "intelligence_dependency_risk_unavailable",
      message: "Dependency risk intelligence is unavailable.",
      details: error.message
    });
  }
}

export function getAgentActivityController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = analyzeAgentActivity({ forceRefresh });

    emitIntelligenceEvents({
      domain: "agents",
      summary: payload.summary,
      alerts: payload.alerts
    });

    res.json(payload);
  } catch (error) {
    res.status(503).json({
      error: "intelligence_agent_activity_unavailable",
      message: "Agent activity intelligence is unavailable.",
      details: error.message
    });
  }
}

export function getPlatformInsightsController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = generatePlatformInsights({ forceRefresh });

    recordIntelligenceEvent({
      eventType: "INTELLIGENCE_SUMMARY",
      severity: payload.top_risks.length > 0 ? "medium" : "info",
      title: "platform intelligence insights generated",
      message: `top_risks=${payload.top_risks.length}, recommendations=${payload.recommended_actions.length}`,
      domain: "platform",
      confidenceScore: payload.confidence_scores?.overall ?? 0.75,
      evidence: payload.evidence_links || []
    });

    for (const risk of payload.top_risks.slice(0, 8)) {
      recordIntelligenceEvent({
        eventType: "INTELLIGENCE_ALERT",
        severity: risk.risk_level || "medium",
        title: `platform risk: ${risk.subject}`,
        message: `${risk.domain} risk detected for ${risk.subject}`,
        domain: risk.domain,
        confidenceScore: risk.confidence_score ?? 0.7,
        evidence: risk.evidence || []
      });
    }

    res.json(payload);
  } catch (error) {
    res.status(503).json({
      error: "intelligence_insights_unavailable",
      message: "Platform intelligence insights are unavailable.",
      details: error.message
    });
  }
}
