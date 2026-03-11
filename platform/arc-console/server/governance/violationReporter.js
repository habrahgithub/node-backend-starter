import { detectGovernanceDrift } from "./driftDetector.js";
import { evaluateGovernancePolicies } from "./policyEvaluator.js";

function normalizeSeverity(value) {
  const normalized = String(value || "medium").toLowerCase();
  if (["critical", "high", "medium", "low"].includes(normalized)) {
    return normalized;
  }
  return "medium";
}

function rankSeverity(value) {
  if (value === "critical") {
    return 4;
  }
  if (value === "high") {
    return 3;
  }
  if (value === "medium") {
    return 2;
  }
  return 1;
}

export function getGovernanceViolations({ forceRefresh = false } = {}) {
  const evaluation = evaluateGovernancePolicies({ forceRefresh });
  const drift = detectGovernanceDrift({ forceRefresh });

  const items = [];

  for (const policy of evaluation.items || []) {
    if (policy.status !== "violation" && policy.status !== "needs_review") {
      continue;
    }

    items.push({
      violation_id: `gov-policy-${policy.policy_id}`,
      component: policy.evaluation_target,
      policy: policy.policy_id,
      severity: normalizeSeverity(policy.severity),
      recommended_action: policy.recommended_action,
      evidence: policy.evidence,
      confidence: policy.confidence,
      operator_approval_required: true
    });
  }

  for (const row of drift.items || []) {
    items.push({
      violation_id: `gov-drift-${row.component}-${row.drift_type}`,
      component: row.component,
      policy: `drift:${row.drift_type}`,
      severity: normalizeSeverity(row.severity),
      recommended_action: row.recommended_action,
      evidence: row.evidence,
      confidence: row.confidence,
      operator_approval_required: true
    });
  }

  items.sort((a, b) => {
    const severity = rankSeverity(b.severity) - rankSeverity(a.severity);
    if (severity !== 0) {
      return severity;
    }

    return Number(b.confidence || 0) - Number(a.confidence || 0);
  });

  return {
    generatedAt: new Date().toISOString(),
    mode: "advisory_read_only",
    items,
    summary: {
      total: items.length,
      critical: items.filter((item) => item.severity === "critical").length,
      high: items.filter((item) => item.severity === "high").length,
      medium: items.filter((item) => item.severity === "medium").length,
      low: items.filter((item) => item.severity === "low").length
    }
  };
}
