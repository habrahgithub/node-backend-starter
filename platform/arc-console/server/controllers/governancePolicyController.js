import { computeGovernanceCompliance } from "../governance/complianceScorer.js";
import { detectGovernanceDrift } from "../governance/driftDetector.js";
import { evaluateGovernancePolicies } from "../governance/policyEvaluator.js";
import { getGovernancePolicies } from "../governance/policyRegistry.js";
import { getGovernanceViolations } from "../governance/violationReporter.js";
import { recordGovernanceEvent } from "../services/observability.js";

export function getGovernancePoliciesController(_req, res) {
  try {
    const payload = getGovernancePolicies();
    return res.json(payload);
  } catch (error) {
    return res.status(503).json({
      error: "governance_policies_unavailable",
      message: "Governance policy registry is unavailable.",
      details: error.message
    });
  }
}

export function evaluateGovernancePoliciesController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = evaluateGovernancePolicies({ forceRefresh });

    recordGovernanceEvent({
      eventType: "GOVERNANCE_POLICY_EVALUATED",
      severity: payload.summary.violation > 0 ? "high" : "info",
      title: "policy evaluation complete",
      message: `total=${payload.summary.total}, violations=${payload.summary.violation}`,
      domain: "policies",
      confidenceScore: payload.summary.average_confidence,
      evidence: [
        `pass=${payload.summary.pass}`,
        `violation=${payload.summary.violation}`,
        `needs_review=${payload.summary.needs_review}`
      ]
    });

    return res.json(payload);
  } catch (error) {
    return res.status(503).json({
      error: "governance_evaluation_unavailable",
      message: "Governance policy evaluation is unavailable.",
      details: error.message
    });
  }
}

export function getGovernanceDriftController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = detectGovernanceDrift({ forceRefresh });

    if (payload.summary.total > 0) {
      recordGovernanceEvent({
        eventType: "GOVERNANCE_VIOLATION_DETECTED",
        severity: payload.summary.high > 0 ? "high" : "medium",
        title: "drift findings detected",
        message: `total=${payload.summary.total}, high=${payload.summary.high}`,
        domain: "drift",
        confidenceScore: 0.82,
        evidence: [`medium=${payload.summary.medium}`, `low=${payload.summary.low}`]
      });
    }

    return res.json(payload);
  } catch (error) {
    return res.status(503).json({
      error: "governance_drift_unavailable",
      message: "Governance drift detection is unavailable.",
      details: error.message
    });
  }
}

export function getGovernanceComplianceController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = computeGovernanceCompliance({
      forceRefresh,
      persistHistory: true
    });

    recordGovernanceEvent({
      eventType: "GOVERNANCE_COMPLIANCE_UPDATED",
      severity: payload.overall_score < 70 ? "high" : payload.overall_score < 85 ? "medium" : "info",
      title: "compliance score updated",
      message: `overall=${payload.overall_score}, trend=${payload.trend}`,
      domain: "compliance",
      confidenceScore: 0.85,
      evidence: [
        `node_score=${payload.node_score}`,
        `service_score=${payload.service_score}`,
        `repo_score=${payload.repo_score}`
      ]
    });

    return res.json(payload);
  } catch (error) {
    return res.status(503).json({
      error: "governance_compliance_unavailable",
      message: "Governance compliance scoring is unavailable.",
      details: error.message
    });
  }
}

export function getGovernanceViolationsController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = getGovernanceViolations({ forceRefresh });

    for (const item of payload.items.slice(0, 12)) {
      recordGovernanceEvent({
        eventType: "GOVERNANCE_VIOLATION_DETECTED",
        severity: item.severity,
        title: item.policy,
        message: item.recommended_action,
        domain: item.component,
        confidenceScore: item.confidence,
        evidence: item.evidence
      });
    }

    return res.json(payload);
  } catch (error) {
    return res.status(503).json({
      error: "governance_violations_unavailable",
      message: "Governance violation reporting is unavailable.",
      details: error.message
    });
  }
}
