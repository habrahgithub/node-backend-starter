import { getWorkflows, runWorkflow } from "../automation/operatorWorkflow.js";

export function getWorkflowsController(_req, res) {
  try {
    res.json(getWorkflows());
  } catch (error) {
    res.status(503).json({
      error: "workflow_catalog_unavailable",
      message: "Workflow catalog is unavailable.",
      details: error.message
    });
  }
}

export function runWorkflowController(req, res) {
  const { workflowId, confirmation } = req.body || {};

  if (!workflowId) {
    return res.status(400).json({
      error: "invalid_request",
      message: "workflowId is required."
    });
  }

  try {
    const result = runWorkflow({
      operator: req.arcSession?.username || "operator",
      workflowId,
      confirmation
    });

    if (result.status === "not_found") {
      return res.status(404).json(result);
    }

    if (result.status === "blocked") {
      return res.status(409).json(result);
    }

    return res.json(result);
  } catch (error) {
    return res.status(503).json({
      error: "workflow_run_unavailable",
      message: "Workflow execution is unavailable.",
      details: error.message
    });
  }
}
