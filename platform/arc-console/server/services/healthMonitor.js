import fs from "fs";
import os from "os";
import path from "path";
import { getAgents, getRepositories, getServices, getSystemRegistry } from "./systemRegistry.js";
import { getLatencyMetrics } from "./observability.js";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getCiCdSignals(repositories) {
  let reposWithWorkflows = 0;

  for (const repo of repositories) {
    if (!repo?.path) {
      continue;
    }

    const workflowsDir = path.join(repo.path, ".github", "workflows");
    if (!fs.existsSync(workflowsDir)) {
      continue;
    }

    try {
      const files = fs.readdirSync(workflowsDir);
      if (files.length > 0) {
        reposWithWorkflows += 1;
      }
    } catch {
      // Ignore unreadable workflow directories and keep monitoring flow non-fatal.
    }
  }

  return {
    monitoredRepositories: repositories.length,
    reposWithWorkflows,
    coverage:
      repositories.length > 0
        ? Number(((reposWithWorkflows / repositories.length) * 100).toFixed(1))
        : 0
  };
}

function getSystemMetrics() {
  try {
    const totalMemoryMb = Math.round(os.totalmem() / 1024 / 1024);
    const freeMemoryMb = Math.round(os.freemem() / 1024 / 1024);
    const usedMemoryMb = totalMemoryMb - freeMemoryMb;

    return {
      host: os.hostname(),
      platform: `${os.platform()} ${os.release()}`,
      uptimeSeconds: Math.round(os.uptime()),
      loadAverage: os.loadavg(),
      memoryMb: {
        total: totalMemoryMb,
        used: usedMemoryMb,
        free: freeMemoryMb
      }
    };
  } catch (error) {
    return {
      host: "unavailable",
      platform: "unavailable",
      uptimeSeconds: 0,
      loadAverage: [],
      memoryMb: {
        total: 0,
        used: 0,
        free: 0
      },
      warning: error.message
    };
  }
}

function buildServiceAvailability(services) {
  const operational = services.filter((service) => service.status === "operational").length;

  return {
    total: services.length,
    operational,
    degraded: services.length - operational,
    details: services.map((service) => ({
      id: service.id,
      name: service.name,
      status: service.status,
      executionReadiness: service.executionReadiness
    }))
  };
}

function buildRepositoryActivity(repositories) {
  const dirty = repositories.filter((repo) => repo.status === "dirty").length;
  const unknown = repositories.filter((repo) => repo.status === "unknown").length;

  return {
    total: repositories.length,
    dirty,
    unknown,
    clean: repositories.length - dirty - unknown,
    details: repositories.map((repo) => ({
      id: repo.id,
      name: repo.name,
      status: repo.status,
      repoType: repo.repoType,
      dirtyCounts: repo.dirtyCounts
    }))
  };
}

function buildAgentActivity(agents) {
  const active = agents.filter((agent) => String(agent.status).toLowerCase() === "active").length;

  return {
    total: agents.length,
    active,
    standby: agents.length - active,
    details: agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      status: agent.status,
      pipelineStage: agent.pipelineStage
    }))
  };
}

export function getPlatformHealth(options = {}) {
  try {
    const registry = getSystemRegistry(options);
    const services = safeArray(getServices(options));
    const repositories = safeArray(getRepositories(options));
    const agents = safeArray(getAgents(options));

    const serviceAvailability = buildServiceAvailability(services);
    const repositoryActivity = buildRepositoryActivity(repositories);
    const agentActivity = buildAgentActivity(agents);
    const ciCd = getCiCdSignals(repositories);
    const systemMetrics = getSystemMetrics();

    const registryWarnings = safeArray(registry.warnings).length;
    const warningCount =
      serviceAvailability.degraded +
      repositoryActivity.dirty +
      repositoryActivity.unknown +
      (ciCd.reposWithWorkflows < ciCd.monitoredRepositories ? 1 : 0) +
      registryWarnings +
      (serviceAvailability.total === 0 ? 1 : 0);

    return {
      overall: warningCount > 0 ? "warning" : "healthy",
      summary:
        warningCount > 0
          ? "Platform requires operator attention."
          : "Platform indicators are healthy.",
      generatedAt: new Date().toISOString(),
      registrySource: registry.source,
      serviceAvailability,
      repositoryActivity,
      ciCd,
      agentActivity,
      systemMetrics,
      latencyMetrics: {
        healthEndpoint: getLatencyMetrics("/api/health"),
        systemStatusEndpoint: getLatencyMetrics("/api/system/status")
      },
      healthSeed: registry.health_status,
      warnings: registry.warnings || []
    };
  } catch (error) {
    return {
      overall: "critical",
      summary: "Health monitoring is unavailable.",
      generatedAt: new Date().toISOString(),
      registrySource: "unavailable",
      serviceAvailability: { total: 0, operational: 0, degraded: 0, details: [] },
      repositoryActivity: { total: 0, dirty: 0, unknown: 0, clean: 0, details: [] },
      ciCd: { monitoredRepositories: 0, reposWithWorkflows: 0, coverage: 0 },
      agentActivity: { total: 0, active: 0, standby: 0, details: [] },
      systemMetrics: getSystemMetrics(),
      latencyMetrics: {
        healthEndpoint: getLatencyMetrics("/api/health"),
        systemStatusEndpoint: getLatencyMetrics("/api/system/status")
      },
      healthSeed: {
        overall: "critical",
        summary: "Health seed unavailable due to runtime error.",
        metrics: {
          monitoredServices: 0,
          dirtyRepositories: 0,
          unknownRepositories: 0,
          activeAgents: 0,
          warningCount: 1
        }
      },
      warnings: [
        {
          level: "error",
          code: "health_monitor_failed",
          message: error.message
        }
      ]
    };
  }
}

export function getServiceHealth(options = {}) {
  return getPlatformHealth(options).serviceAvailability;
}
