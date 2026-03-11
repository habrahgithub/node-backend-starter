import { listAgentState, runAgentTask } from "../automation/agentOrchestrator.js";

export function getAgentStateController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    res.json(listAgentState({ forceRefresh }));
  } catch (error) {
    res.status(503).json({
      error: "agent_state_unavailable",
      message: "Agent state is unavailable.",
      details: error.message
    });
  }
}

export function runAgentTaskController(req, res) {
  const { agentId, task, payload, pipelineStage } = req.body || {};

  if (!agentId || !task) {
    return res.status(400).json({
      error: "invalid_request",
      message: "agentId and task are required."
    });
  }

  try {
    const result = runAgentTask({
      operator: req.arcSession?.username || "operator",
      agentId,
      task,
      payload,
      pipelineStage
    });

    if (result.status === "not_found") {
      return res.status(404).json(result);
    }

    return res.json(result);
  } catch (error) {
    return res.status(503).json({
      error: "agent_run_unavailable",
      message: "Agent task trigger is unavailable.",
      details: error.message
    });
  }
}
