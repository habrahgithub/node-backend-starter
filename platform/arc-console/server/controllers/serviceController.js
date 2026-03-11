import { getServiceHealth } from "../services/healthMonitor.js";
import { getServices } from "../services/systemRegistry.js";

export function listServices(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    res.json({ items: getServices({ forceRefresh }) });
  } catch (error) {
    res.status(503).json({
      error: "services_unavailable",
      message: "Service catalog is unavailable.",
      details: error.message
    });
  }
}

export function listServiceHealth(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = getServiceHealth({ forceRefresh });

    if (!payload || typeof payload !== "object") {
      return res.status(503).json({
        error: "service_health_unavailable",
        message: "Service health payload is unavailable."
      });
    }

    return res.json(payload);
  } catch (error) {
    return res.status(503).json({
      error: "service_health_unavailable",
      message: "Service health is unavailable.",
      details: error.message
    });
  }
}
