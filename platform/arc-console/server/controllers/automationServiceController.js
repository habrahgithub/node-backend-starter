import { getServiceMetrics, restartService, runServiceDiagnostics } from "../automation/serviceController.js";

export function getServiceMetricsController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    res.json(getServiceMetrics({ forceRefresh }));
  } catch (error) {
    res.status(503).json({
      error: "service_metrics_unavailable",
      message: "Service metrics are unavailable.",
      details: error.message
    });
  }
}

export function runServiceDiagnosticsController(req, res) {
  const { serviceId, confirmation } = req.body || {};

  if (!serviceId) {
    return res.status(400).json({
      error: "invalid_request",
      message: "serviceId is required."
    });
  }

  try {
    const result = runServiceDiagnostics({
      operator: req.arcSession?.username || "operator",
      serviceId,
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
      error: "service_diagnostics_unavailable",
      message: "Service diagnostics action is unavailable.",
      details: error.message
    });
  }
}

export function restartServiceController(req, res) {
  const { serviceId, confirmation, simulate } = req.body || {};

  if (!serviceId) {
    return res.status(400).json({
      error: "invalid_request",
      message: "serviceId is required."
    });
  }

  try {
    const result = restartService({
      operator: req.arcSession?.username || "operator",
      serviceId,
      confirmation,
      simulate: simulate !== false
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
      error: "service_restart_unavailable",
      message: "Service restart action is unavailable.",
      details: error.message
    });
  }
}
