import { getControlPlaneLogs } from "../services/systemRegistry.js";
import { getObservabilitySnapshot, getRecentEvents } from "../services/observability.js";

export function listLogs(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const level = String(req.query.level || "").trim().toLowerCase();
    const limit = Number(req.query.limit || 200);
    const levels = level ? [level] : [];

    const controlPlaneItems = getControlPlaneLogs({ forceRefresh });
    const runtimeItems = getRecentEvents({
      limit: Number.isFinite(limit) ? Math.min(limit, 500) : 200,
      levels
    });

    res.json({
      items: [...runtimeItems, ...controlPlaneItems],
      observability: getObservabilitySnapshot()
    });
  } catch (error) {
    res.status(503).json({
      error: "logs_unavailable",
      message: "Control-plane logs are unavailable.",
      details: error.message
    });
  }
}
