import { detectIncidentPatterns } from "../reliability/incidentPatternDetector.js";
import {
  getIncidentLearningLedger,
  recordIncidentLearningEntry
} from "../reliability/incidentLearningLedger.js";
import { getRemediationPlaybookByIncident, getRemediationPlaybooks } from "../reliability/remediationPlaybookEngine.js";
import { analyzeReliabilityTrends } from "../reliability/reliabilityTrendAnalyzer.js";
import { getServiceRecoveryAdvice } from "../reliability/serviceRecoveryAdvisor.js";
import { recordOperatorAction, recordReliabilityEvent } from "../services/observability.js";

function emitIncidentEvents(payload) {
  recordReliabilityEvent({
    eventType: "RELIABILITY_INCIDENT_DETECTED",
    severity: payload.summary?.high > 0 ? "high" : "info",
    title: "reliability incidents analyzed",
    message: JSON.stringify(payload.summary || {}),
    domain: "incidents",
    confidenceScore: 0.82,
    evidence: [`incidents=${payload.summary?.total || 0}`]
  });

  for (const incident of (payload.items || []).filter((item) => item.severity === "high").slice(0, 8)) {
    recordReliabilityEvent({
      eventType: "RELIABILITY_INCIDENT_DETECTED",
      severity: "high",
      title: incident.incident_id,
      message: `${incident.service} ${incident.pattern_type} (${incident.occurrence_count})`,
      domain: incident.service,
      confidenceScore: incident.confidence,
      evidence: incident.evidence
    });
  }
}

export function getReliabilityIncidentsController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = detectIncidentPatterns({ forceRefresh });

    emitIncidentEvents(payload);
    res.json(payload);
  } catch (error) {
    res.status(503).json({
      error: "reliability_incidents_unavailable",
      message: "Reliability incident patterns are unavailable.",
      details: error.message
    });
  }
}

export function getReliabilityPlaybooksController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = getRemediationPlaybooks({ forceRefresh });

    recordReliabilityEvent({
      eventType: "RELIABILITY_PLAYBOOK_SUGGESTED",
      severity: payload.summary?.total > 0 ? "info" : "medium",
      title: "remediation playbooks generated",
      message: JSON.stringify(payload.summary || {}),
      domain: "playbooks",
      confidenceScore: 0.83,
      evidence: [`playbooks=${payload.summary?.total || 0}`]
    });

    res.json(payload);
  } catch (error) {
    res.status(503).json({
      error: "reliability_playbooks_unavailable",
      message: "Remediation playbooks are unavailable.",
      details: error.message
    });
  }
}

export function getReliabilityPlaybookByIncidentController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const incidentId = String(req.params.incidentId || "").trim();

    if (!incidentId) {
      return res.status(400).json({
        error: "invalid_request",
        message: "incidentId is required."
      });
    }

    const payload = getRemediationPlaybookByIncident(incidentId, { forceRefresh });
    if (!payload) {
      return res.status(404).json({
        error: "playbook_not_found",
        message: "No playbook found for the requested incident."
      });
    }

    recordReliabilityEvent({
      eventType: "RELIABILITY_PLAYBOOK_SUGGESTED",
      severity: payload.approval_required ? "info" : "medium",
      title: payload.playbook_title,
      message: `playbook requested for ${payload.incident_id}`,
      domain: payload.service,
      confidenceScore: payload.confidence,
      evidence: payload.evidence
    });

    return res.json(payload);
  } catch (error) {
    return res.status(503).json({
      error: "reliability_playbook_lookup_unavailable",
      message: "Playbook lookup is unavailable.",
      details: error.message
    });
  }
}

export function getReliabilityTrendsController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = analyzeReliabilityTrends({ forceRefresh });

    recordReliabilityEvent({
      eventType: "RELIABILITY_TREND_SUMMARY",
      severity: payload.summary?.high > 0 ? "high" : "info",
      title: "reliability trend summary generated",
      message: JSON.stringify(payload.summary || {}),
      domain: "trends",
      confidenceScore: 0.84,
      evidence: [`average_score=${payload.summary?.average_score ?? 0}`]
    });

    res.json(payload);
  } catch (error) {
    res.status(503).json({
      error: "reliability_trends_unavailable",
      message: "Reliability trends are unavailable.",
      details: error.message
    });
  }
}

export function getReliabilityRecoveryAdviceController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = getServiceRecoveryAdvice({ forceRefresh });

    recordReliabilityEvent({
      eventType: "RELIABILITY_PLAYBOOK_SUGGESTED",
      severity: payload.summary?.operatorRunCandidates > 0 ? "medium" : "info",
      title: "service recovery advice generated",
      message: JSON.stringify(payload.summary || {}),
      domain: "recovery",
      confidenceScore: 0.83,
      evidence: [`operator_candidates=${payload.summary?.operatorRunCandidates || 0}`]
    });

    res.json(payload);
  } catch (error) {
    res.status(503).json({
      error: "reliability_recovery_advice_unavailable",
      message: "Service recovery advice is unavailable.",
      details: error.message
    });
  }
}

export function getReliabilityLearningController(_req, res) {
  try {
    const payload = getIncidentLearningLedger();
    res.json(payload);
  } catch (error) {
    res.status(503).json({
      error: "reliability_learning_unavailable",
      message: "Incident learning ledger is unavailable.",
      details: error.message
    });
  }
}

export function recordReliabilityLearningController(req, res) {
  try {
    const result = recordIncidentLearningEntry(req.body || {}, {
      operator: req.arcSession?.username || "operator"
    });

    if (!result.ok) {
      return res.status(400).json({
        error: "invalid_learning_payload",
        message: "Learning record payload validation failed.",
        issues: result.errors
      });
    }

    recordOperatorAction({
      operator: req.arcSession?.username || "operator",
      action: "reliability.learning.record",
      target: result.record.incident_id,
      result: "recorded",
      durationMs: 0,
      metadata: {
        recordId: result.record.id
      }
    });

    recordReliabilityEvent({
      eventType: "RELIABILITY_LEARNING_RECORDED",
      severity: "info",
      title: result.record.incident_id,
      message: "Incident learning entry recorded.",
      domain: "learning",
      confidenceScore: result.record.confidence,
      evidence: result.record.evidence
    });

    return res.status(201).json({
      record: result.record,
      summary: result.summary
    });
  } catch (error) {
    return res.status(503).json({
      error: "reliability_learning_record_unavailable",
      message: "Failed to record reliability learning entry.",
      details: error.message
    });
  }
}
