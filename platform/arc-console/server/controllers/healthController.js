import { getPlatformHealth } from "../services/healthMonitor.js";

export function getHealth(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = getPlatformHealth({ forceRefresh });

    if (!payload || typeof payload !== "object") {
      return res.status(503).json({
        error: "health_unavailable",
        message: "Health payload is unavailable."
      });
    }

    return res.json(payload);
  } catch (error) {
    return res.status(503).json({
      error: "health_unavailable",
      message: "Platform health is unavailable.",
      details: error.message
    });
  }
}
