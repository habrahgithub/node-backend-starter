import { getAgents } from "../services/systemRegistry.js";
import { recordOperatorAction } from "../services/observability.js";

const SUPPORTED_AGENTS = new Set(["axis", "forge", "sentinel", "warden", "cline"]);

function nowMs() {
  return Date.now();
}

function durationMs(startedAt) {
  return Number((Date.now() - startedAt).toFixed(2));
}

export function listAgentState({ forceRefresh = false } = {}) {
  const items = getAgents({ forceRefresh }).map((agent) => ({
    id: agent.id,
    name: agent.name,
    role: agent.role,
    status: agent.status,
    currentTask: agent.currentTask,
    pipelineStage: agent.pipelineStage,
    supported: SUPPORTED_AGENTS.has(String(agent.id || "").toLowerCase())
  }));

  return {
    generatedAt: new Date().toISOString(),
    mode: "operator_mediated",
    items,
    summary: {
      total: items.length,
      active: items.filter((item) => String(item.status).toLowerCase() === "active").length,
      supported: items.filter((item) => item.supported).length
    }
  };
}

export function runAgentTask({ operator, agentId, task, payload = {}, pipelineStage = "orchestration" }) {
  const startedAt = nowMs();
  const state = listAgentState({ forceRefresh: true });
  const agent = state.items.find((item) => item.id === agentId || item.name.toLowerCase() === String(agentId).toLowerCase());

  if (!agent) {
    const result = {
      status: "not_found",
      message: "Requested agent was not found in the managed catalog.",
      simulated: true,
      requestedTask: task,
      agentId
    };

    recordOperatorAction({
      operator,
      action: "agent.run",
      target: String(agentId || "unknown"),
      result: "not_found",
      durationMs: durationMs(startedAt),
      metadata: result
    });

    return result;
  }

  const safeResult = {
    status: "queued_simulation",
    message: "Task accepted in safe mode. Execution is simulated only.",
    simulated: true,
    agent: {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      currentStage: agent.pipelineStage
    },
    task: {
      name: task,
      payload,
      requestedStage: pipelineStage
    }
  };

  recordOperatorAction({
    operator,
    action: "agent.run",
    target: agent.id,
    result: safeResult.status,
    durationMs: durationMs(startedAt),
    metadata: {
      task,
      pipelineStage,
      simulated: true
    }
  });

  return safeResult;
}
