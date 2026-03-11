import { getDependencyRisk, getStaleBranches } from "../automation/repoGovernor.js";
import { analyzeAgentActivity } from "../intelligence/agentActivityAnalyzer.js";
import { getServiceHealth } from "../services/healthMonitor.js";
import { getFabricTelemetry } from "../fabric/nodeTelemetryAggregator.js";
import { listActiveGovernancePolicies } from "./policyRegistry.js";

function evaluateNodeHeartbeat(policy, inputs) {
  const maxOffline = Math.max(0, Number(policy.threshold?.max_offline_nodes ?? 0));
  const maxDegraded = Math.max(0, Number(policy.threshold?.max_degraded_nodes ?? 0));
  const offline = Number(inputs.fabricTelemetry?.summary?.nodes_offline || 0);
  const degraded = Number(inputs.fabricTelemetry?.summary?.nodes_degraded || 0);

  const violated = offline > maxOffline || degraded > maxDegraded;

  return {
    status: violated ? "violation" : "pass",
    confidence: 0.89,
    evidence: [
      `nodes_offline=${offline}`,
      `nodes_degraded=${degraded}`,
      `threshold.max_offline_nodes=${maxOffline}`,
      `threshold.max_degraded_nodes=${maxDegraded}`
    ],
    recommended_action: violated
      ? "Review offline/degraded nodes and approve heartbeat remediation workflow."
      : "Heartbeat policy currently within threshold."
  };
}

function evaluateServiceHealth(policy, inputs) {
  const maxDegraded = Math.max(0, Number(policy.threshold?.max_degraded_services ?? 0));
  const degraded = Number(inputs.serviceHealth?.degraded || 0);

  return {
    status: degraded > maxDegraded ? "violation" : "pass",
    confidence: 0.86,
    evidence: [`services_degraded=${degraded}`, `threshold.max_degraded_services=${maxDegraded}`],
    recommended_action:
      degraded > maxDegraded
        ? "Run diagnostics for degraded services and approve stabilization sequence."
        : "Service health policy currently within threshold."
  };
}

function evaluateRepoStale(policy, inputs) {
  const maxStale = Math.max(0, Number(policy.threshold?.max_repositories_with_stale_branches ?? 0));
  const stale = Number(inputs.staleBranches?.summary?.withStaleBranches || 0);

  return {
    status: stale > maxStale ? "violation" : "pass",
    confidence: 0.84,
    evidence: [`repos_with_stale_branches=${stale}`, `threshold.max_repositories_with_stale_branches=${maxStale}`],
    recommended_action:
      stale > maxStale
        ? "Review stale branches and prepare operator-approved cleanup plan."
        : "Repository stale-branch policy currently within threshold."
  };
}

function evaluateDependencyRisk(policy, inputs) {
  const maxHigh = Math.max(0, Number(policy.threshold?.max_high_risk_dependencies ?? 0));
  const highRisk = Number(inputs.dependencyRisk?.summary?.high || 0);

  return {
    status: highRisk > maxHigh ? "violation" : "pass",
    confidence: 0.82,
    evidence: [`high_risk_dependencies=${highRisk}`, `threshold.max_high_risk_dependencies=${maxHigh}`],
    recommended_action:
      highRisk > maxHigh
        ? "Schedule dependency risk review and operator-approved upgrade workflow."
        : "Dependency risk policy currently within threshold."
  };
}

function evaluateAgentActivity(policy, inputs) {
  const maxStalled = Math.max(0, Number(policy.threshold?.max_stalled_agents ?? 0));
  const stalled = Number(inputs.agentActivity?.summary?.stalled || 0);

  return {
    status: stalled > maxStalled ? "violation" : "pass",
    confidence: 0.8,
    evidence: [`stalled_agents=${stalled}`, `threshold.max_stalled_agents=${maxStalled}`],
    recommended_action:
      stalled > maxStalled
        ? "Run agent-health-check workflow and approve task-routing remediation."
        : "Agent activity policy currently within threshold."
  };
}

function evaluatePolicy(policy, inputs) {
  if (policy.policy_id === "node_heartbeat_threshold") {
    return evaluateNodeHeartbeat(policy, inputs);
  }
  if (policy.policy_id === "service_health_exposure") {
    return evaluateServiceHealth(policy, inputs);
  }
  if (policy.policy_id === "repo_stale_branches_limit") {
    return evaluateRepoStale(policy, inputs);
  }
  if (policy.policy_id === "dependency_risk_limit") {
    return evaluateDependencyRisk(policy, inputs);
  }
  if (policy.policy_id === "agent_activity_window") {
    return evaluateAgentActivity(policy, inputs);
  }

  return {
    status: "needs_review",
    confidence: 0.4,
    evidence: [`unsupported_policy=${policy.policy_id}`],
    recommended_action: "Policy mapping is missing and needs governance review."
  };
}

export function evaluateGovernancePolicies({ forceRefresh = false, policies = null } = {}) {
  const activePolicies = Array.isArray(policies) ? policies : listActiveGovernancePolicies();

  if (activePolicies.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      mode: "advisory_read_only",
      items: [],
      summary: {
        total: 0,
        pass: 0,
        violation: 0,
        needs_review: 0,
        average_confidence: 0
      },
      warnings: ["No active policies configured."]
    };
  }

  const inputs = {
    fabricTelemetry: getFabricTelemetry({ forceRefresh }),
    serviceHealth: getServiceHealth({ forceRefresh }),
    staleBranches: getStaleBranches({ forceRefresh }),
    dependencyRisk: getDependencyRisk({ forceRefresh }),
    agentActivity: analyzeAgentActivity({ forceRefresh })
  };

  const items = activePolicies.map((policy) => {
    try {
      const result = evaluatePolicy(policy, inputs);
      return {
        policy_id: policy.policy_id,
        description: policy.description,
        evaluation_target: policy.evaluation_target,
        severity: policy.severity,
        threshold: policy.threshold,
        status: result.status,
        evidence: result.evidence,
        confidence: Number(Number(result.confidence || 0).toFixed(2)),
        recommended_action: result.recommended_action,
        operator_approval_required: result.status !== "pass"
      };
    } catch (error) {
      return {
        policy_id: policy.policy_id,
        description: policy.description,
        evaluation_target: policy.evaluation_target,
        severity: policy.severity,
        threshold: policy.threshold,
        status: "needs_review",
        evidence: [`evaluation_error=${error.message}`],
        confidence: 0.35,
        recommended_action: "Policy evaluation failed; review inputs and retry.",
        operator_approval_required: true
      };
    }
  });

  const avgConfidence =
    items.length > 0
      ? Number((items.reduce((sum, item) => sum + Number(item.confidence || 0), 0) / items.length).toFixed(2))
      : 0;

  return {
    generatedAt: new Date().toISOString(),
    mode: "advisory_read_only",
    items,
    summary: {
      total: items.length,
      pass: items.filter((item) => item.status === "pass").length,
      violation: items.filter((item) => item.status === "violation").length,
      needs_review: items.filter((item) => item.status === "needs_review").length,
      average_confidence: avgConfidence
    }
  };
}
