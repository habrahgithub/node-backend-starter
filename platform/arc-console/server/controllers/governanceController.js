import fs from "fs";
import { env } from "../config/env.js";
import { getPlatformHealth } from "../services/healthMonitor.js";
import { getSystemRegistry } from "../services/systemRegistry.js";
import { getLatencyMetrics, getRecentEvents } from "../services/observability.js";

function mapToCount(items, mapper) {
  const counts = new Map();

  for (const item of items) {
    const key = mapper(item) || "unknown";
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function parseRecoveryBacklogSummary() {
  const summary = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    source: env.recoveryBacklogPath,
    sourceFound: false
  };

  if (!fs.existsSync(env.recoveryBacklogPath)) {
    return summary;
  }

  summary.sourceFound = true;

  const content = fs.readFileSync(env.recoveryBacklogPath, "utf8");
  const lines = content.split(/\r?\n/);

  let current = "";
  for (const line of lines) {
    const normalized = line.trim().toLowerCase();

    if (normalized === "## critical") {
      current = "critical";
      continue;
    }
    if (normalized === "## high") {
      current = "high";
      continue;
    }
    if (normalized === "## medium") {
      current = "medium";
      continue;
    }
    if (normalized === "## low") {
      current = "low";
      continue;
    }

    if (line.trim().startsWith("- ID") || line.trim().startsWith("ID")) {
      if (current && typeof summary[current] === "number") {
        summary[current] += 1;
      }
    }
  }

  return summary;
}

export function getGovernanceSummary(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const registry = getSystemRegistry({ forceRefresh });
    const health = getPlatformHealth({ forceRefresh });

    const priorityDistribution = mapToCount(registry.services || [], (service) => service.priority || "unknown");
    const statusDistribution = mapToCount(
      registry.services || [],
      (service) => service.lifecycleStatus || service.status || "unknown"
    );
    const repoBoundaryStatus = mapToCount(registry.repositories || [], (repo) => repo.repoType || "unknown");

    const warningCenter = {
      currentWarnings: registry.warnings || [],
      warningCount: (registry.warnings || []).length,
      recentWarningHistory: getRecentEvents({ limit: 50, levels: ["warning", "error"] })
    };

    const systemHealthSummary = {
      overall: health.overall,
      summary: health.summary,
      serviceAvailability: health.serviceAvailability,
      repositoryActivity: health.repositoryActivity,
      agentActivity: health.agentActivity,
      healthLatency: getLatencyMetrics("/api/health")
    };

    return res.json({
      generatedAt: new Date().toISOString(),
      priorityDistribution,
      statusDistribution,
      repoBoundaryStatus,
      recoveryBacklogSummary: parseRecoveryBacklogSummary(),
      warningCenter,
      systemHealthSummary
    });
  } catch (error) {
    return res.status(503).json({
      error: "governance_summary_unavailable",
      message: "Governance summary is unavailable.",
      details: error.message
    });
  }
}
