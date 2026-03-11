import { env } from "../config/env.js";
import { getSystemRegistry } from "../services/systemRegistry.js";

export function getSystemStatus(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const registry = getSystemRegistry({ forceRefresh });

    res.json({
      console: {
        name: env.consoleName,
        environment: env.environment,
        registrySource: env.registrySource,
        unifiedServer: true,
        dashboardEnabled: env.serveDashboard
      },
      generatedAt: registry.generatedAt,
      counts: {
        services: registry.services.length,
        repositories: registry.repositories.length,
        agents: registry.agents.length
      },
      summary: registry.health_status,
      warnings: registry.warnings || [],
      registry
    });
  } catch (error) {
    res.status(503).json({
      error: "system_status_unavailable",
      message: "System status is unavailable.",
      details: error.message
    });
  }
}
