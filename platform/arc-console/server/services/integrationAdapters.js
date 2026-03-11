import fs from "fs";
import { env } from "../config/env.js";
import { getAgents, getServices, getSystemRegistry } from "./systemRegistry.js";

function fileSignal(filePath) {
  if (!filePath) {
    return {
      path: "",
      exists: false,
      lastModified: null
    };
  }

  if (!fs.existsSync(filePath)) {
    return {
      path: filePath,
      exists: false,
      lastModified: null
    };
  }

  const stats = fs.statSync(filePath);
  return {
    path: filePath,
    exists: true,
    lastModified: stats.mtime.toISOString(),
    sizeBytes: stats.size
  };
}

async function fetchJsonWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: `Request failed with status ${response.status}`
      };
    }

    return {
      ok: true,
      status: response.status,
      data: await response.json()
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      message: error.name === "AbortError" ? "Request timed out" : error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function refreshRepoInventory() {
  const registry = getSystemRegistry({ forceRefresh: true });

  return {
    refreshedAt: new Date().toISOString(),
    mode: "read_only",
    summary: {
      total: registry.repositories.length,
      dirty: registry.repositories.filter((item) => item.status === "dirty").length,
      unknown: registry.repositories.filter((item) => item.status === "unknown").length,
      clean: registry.repositories.filter((item) => item.status === "clean").length
    }
  };
}

export function refreshArtifactSignals() {
  return {
    refreshedAt: new Date().toISOString(),
    mode: "read_only",
    files: {
      assetRegistry: fileSignal(env.assetRegistryPath),
      recoveryMovePlan: fileSignal(env.recoveryMovePlanPath),
      recoveryBacklog: fileSignal(env.recoveryBacklogPath),
      agentState: fileSignal(env.agentStatePath)
    }
  };
}

export async function getAgentStateAdapter() {
  if (env.agentStateEndpoint) {
    const result = await fetchJsonWithTimeout(env.agentStateEndpoint, env.integrationFetchTimeoutMs);

    if (result.ok) {
      const payload = Array.isArray(result.data) ? result.data : result.data?.items || [];
      return {
        source: "endpoint",
        endpoint: env.agentStateEndpoint,
        count: payload.length,
        items: payload
      };
    }

    return {
      source: "endpoint",
      endpoint: env.agentStateEndpoint,
      error: result.message,
      count: 0,
      items: []
    };
  }

  const items = getAgents({ forceRefresh: true });

  return {
    source: env.agentStatePath ? "file_or_registry" : "registry",
    filePath: env.agentStatePath || null,
    count: items.length,
    items
  };
}

export async function getServiceHeartbeatAdapter() {
  if (env.serviceHeartbeatEndpoint) {
    const result = await fetchJsonWithTimeout(env.serviceHeartbeatEndpoint, env.integrationFetchTimeoutMs);

    if (result.ok) {
      const payload = Array.isArray(result.data) ? result.data : result.data?.items || [];
      return {
        source: "endpoint",
        endpoint: env.serviceHeartbeatEndpoint,
        count: payload.length,
        items: payload
      };
    }

    return {
      source: "endpoint",
      endpoint: env.serviceHeartbeatEndpoint,
      error: result.message,
      count: 0,
      items: []
    };
  }

  const services = getServices({ forceRefresh: true });
  return {
    source: "registry",
    count: services.length,
    items: services.map((service) => ({
      id: service.id,
      name: service.name,
      status: service.status,
      executionReadiness: service.executionReadiness
    }))
  };
}
