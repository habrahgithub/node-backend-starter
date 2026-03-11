import { getRepositories } from "../services/systemRegistry.js";

export function listRepositories(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const items = getRepositories({ forceRefresh });

    res.json({
      items,
      summary: {
        total: items.length,
        dirty: items.filter((item) => item.status === "dirty").length,
        unknown: items.filter((item) => item.status === "unknown").length,
        clean: items.filter((item) => item.status === "clean").length
      }
    });
  } catch (error) {
    res.status(503).json({
      error: "repositories_unavailable",
      message: "Repository inventory is unavailable.",
      details: error.message
    });
  }
}
