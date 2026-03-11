import { listAgentState } from "../automation/agentOrchestrator.js";
import { getRecentEvents } from "../services/observability.js";

function agentEvents(agentId, events) {
  return events.filter((item) => item.source === "operator-action" && item.action === "agent.run" && item.target === agentId);
}

function successRate(items) {
  if (items.length === 0) {
    return 100;
  }

  const success = items.filter((item) => String(item.result || "").includes("queued") || String(item.result || "").includes("completed"));
  return Number(((success.length / items.length) * 100).toFixed(1));
}

function trendFor(agent, taskCount, successRateValue) {
  const status = String(agent.status || "").toLowerCase();

  if (status === "active" && taskCount === 0) {
    return "stalled";
  }

  if (taskCount >= 4) {
    return "high";
  }

  if (taskCount >= 1 && successRateValue >= 80) {
    return "steady";
  }

  if (taskCount >= 1) {
    return "unstable";
  }

  return "idle";
}

function confidenceForAgent(taskCount, supported) {
  let confidence = 0.64;

  if (supported) {
    confidence += 0.12;
  }

  if (taskCount >= 1) {
    confidence += 0.16;
  }

  if (taskCount >= 4) {
    confidence += 0.06;
  }

  return Number(Math.min(0.95, confidence).toFixed(2));
}

export function analyzeAgentActivity({ forceRefresh = false } = {}) {
  const state = listAgentState({ forceRefresh });
  const events = getRecentEvents({ limit: 1000 });

  const items = (state.items || []).map((agent) => {
    const records = agentEvents(agent.id, events);
    const runs = records.length;
    const successRateValue = successRate(records);
    const activityTrend = trendFor(agent, runs, successRateValue);

    return {
      agent: agent.name,
      agent_id: agent.id,
      tasks_run: runs,
      success_rate: successRateValue,
      activity_trend: activityTrend,
      confidence_score: confidenceForAgent(runs, agent.supported),
      evidence: [
        `agent_status=${agent.status}`,
        `pipeline_stage=${agent.pipelineStage}`,
        `task_records=${runs}`,
        `supported=${agent.supported}`
      ],
      recommended_action: {
        text:
          activityTrend === "stalled"
            ? "Run operator-approved agent-health-check workflow and validate task routing."
            : "Continue monitoring agent activity in intelligence dashboard.",
        operator_approval_required: true
      }
    };
  });

  const alerts = items
    .filter((item) => item.activity_trend === "stalled" || item.success_rate < 70)
    .map((item) => ({
      severity: item.success_rate < 50 ? "high" : "medium",
      title: `Agent activity alert: ${item.agent}`,
      message: `${item.agent} trend=${item.activity_trend}, success_rate=${item.success_rate}.`,
      evidence: item.evidence,
      confidence_score: item.confidence_score
    }));

  return {
    generatedAt: new Date().toISOString(),
    mode: "advisory_read_only",
    items,
    alerts,
    summary: {
      total: items.length,
      stalled: items.filter((item) => item.activity_trend === "stalled").length,
      unstable: items.filter((item) => item.activity_trend === "unstable").length,
      averageSuccessRate:
        items.length > 0 ? Number((items.reduce((sum, item) => sum + item.success_rate, 0) / items.length).toFixed(2)) : 0
    }
  };
}
