import { getAgents } from "../services/systemRegistry.js";

export function listAgents(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const statusFilter = String(req.query.status || "").trim().toLowerCase();
    const catalog = getAgents({ forceRefresh });

    const items = catalog.filter((agent) => {
      if (!statusFilter) {
        return true;
      }

      return String(agent.status).toLowerCase() === statusFilter;
    });

    res.json({
      items,
      summary: {
        total: items.length,
        active: items.filter((item) => String(item.status).toLowerCase() === "active").length,
        standby: items.filter((item) => String(item.status).toLowerCase() !== "active").length
      },
      warnings: items.length === 0 ? ["No agent entries matched the requested filter."] : []
    });
  } catch (error) {
    res.status(503).json({
      error: "agents_unavailable",
      message: "Agent catalog is unavailable.",
      details: error.message
    });
  }
}
