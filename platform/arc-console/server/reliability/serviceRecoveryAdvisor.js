import { getRemediationPlaybooks } from "./remediationPlaybookEngine.js";
import { analyzeReliabilityTrends } from "./reliabilityTrendAnalyzer.js";

function actionMode(item) {
  if (item.risk_level === "high" || item.trend === "chronic") {
    return "operator_run_after_simulation";
  }

  return "simulation_only";
}

function recommendedAction(item, playbook) {
  if (item.risk_level === "high") {
    return `Run diagnostics simulation, then execute ${playbook?.playbook_title || "reliability playbook"} after operator approval.`;
  }

  if (item.risk_level === "medium") {
    return "Run platform-health-check simulation and monitor for recurring incidents.";
  }

  return "Continue monitoring; no immediate recovery action required.";
}

function prerequisites(item) {
  const base = [
    "Authenticated operator session",
    "Latest reliability incidents and trends reviewed",
    "Approval recorded before any operator-run action"
  ];

  if (item.risk_level !== "low") {
    base.push("Diagnostic simulation completed");
  }

  return base;
}

export function getServiceRecoveryAdvice({ forceRefresh = false } = {}) {
  const trends = analyzeReliabilityTrends({ forceRefresh });
  const playbooks = getRemediationPlaybooks({ forceRefresh });

  const playbookByService = new Map((playbooks.items || []).map((item) => [item.service, item]));

  const items = (trends.items || []).map((item) => {
    const playbook = playbookByService.get(item.service);

    return {
      service: item.service,
      recommended_action: recommendedAction(item, playbook),
      action_mode: actionMode(item),
      prerequisites: prerequisites(item),
      approval_required: true,
      confidence: Number(Math.min(0.98, Number(item.confidence || 0.7) + 0.05).toFixed(2)),
      evidence: item.evidence,
      linked_playbook: playbook?.incident_id || "none"
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    mode: "advisory_service_recovery",
    items,
    summary: {
      total: items.length,
      operatorRunCandidates: items.filter((item) => item.action_mode === "operator_run_after_simulation").length,
      simulationOnly: items.filter((item) => item.action_mode === "simulation_only").length
    }
  };
}
