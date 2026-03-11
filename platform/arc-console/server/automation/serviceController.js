import { env } from "../config/env.js";
import { getServiceHealth } from "../services/healthMonitor.js";
import { recordOperatorAction } from "../services/observability.js";
import { getServices } from "../services/systemRegistry.js";

function elapsedMs(startedAt) {
  return Number((Date.now() - startedAt).toFixed(2));
}

function findService(serviceId, forceRefresh = true) {
  const normalized = String(serviceId || "").toLowerCase();
  return getServices({ forceRefresh }).find(
    (service) => service.id === normalized || String(service.name || "").toLowerCase() === normalized
  );
}

function hasValidSafetyConfirmation(confirmation) {
  return String(confirmation || "") === env.serviceSafetyConfirmationToken;
}

export function getServiceMetrics({ forceRefresh = false } = {}) {
  const services = getServices({ forceRefresh });
  const health = getServiceHealth({ forceRefresh });

  const items = services.map((service) => {
    const detail = (health.details || []).find((entry) => entry.id === service.id);

    return {
      id: service.id,
      name: service.name,
      status: service.status,
      runtime: service.runtime,
      lifecycleStatus: service.lifecycleStatus,
      executionReadiness: service.executionReadiness,
      lastLatencyMs: detail?.latencyMs ?? 0,
      warningCount: detail?.warnings?.length ?? 0
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    mode: "safe_simulation",
    summary: {
      total: items.length,
      operational: items.filter((item) => item.status === "operational").length,
      degraded: items.filter((item) => item.status !== "operational").length
    },
    items
  };
}

export function runServiceDiagnostics({ operator, serviceId, confirmation }) {
  const startedAt = Date.now();
  const service = findService(serviceId, true);

  if (!service) {
    const result = {
      status: "not_found",
      message: "Requested service was not found.",
      simulated: true,
      serviceId
    };

    recordOperatorAction({
      operator,
      action: "service.diagnostics",
      target: String(serviceId || "unknown"),
      result: result.status,
      durationMs: elapsedMs(startedAt),
      metadata: result
    });

    return result;
  }

  if (!hasValidSafetyConfirmation(confirmation)) {
    const result = {
      status: "blocked",
      message: "Safety confirmation token is required for diagnostics actions.",
      simulated: true,
      confirmationRequired: true
    };

    recordOperatorAction({
      operator,
      action: "service.diagnostics",
      target: service.id,
      result: "blocked",
      durationMs: elapsedMs(startedAt),
      metadata: result
    });

    return result;
  }

  const diagnostics = {
    service: {
      id: service.id,
      name: service.name,
      status: service.status,
      runtime: service.runtime
    },
    checks: [
      { id: "registry_presence", status: "pass", message: "Service exists in registry." },
      {
        id: "execution_readiness",
        status: service.executionReadiness === "SAFE_NOW" ? "pass" : "warn",
        message: `Execution readiness: ${service.executionReadiness}`
      },
      {
        id: "lifecycle_alignment",
        status: service.lifecycleStatus === "ACTIVE" || service.lifecycleStatus === "STABLE" ? "pass" : "warn",
        message: `Lifecycle state: ${service.lifecycleStatus}`
      }
    ],
    simulated: true
  };

  recordOperatorAction({
    operator,
    action: "service.diagnostics",
    target: service.id,
    result: "completed_simulation",
    durationMs: elapsedMs(startedAt),
    metadata: {
      simulated: true,
      checks: diagnostics.checks.length
    }
  });

  return {
    status: "completed_simulation",
    message: "Diagnostics completed in safe mode.",
    ...diagnostics
  };
}

export function restartService({ operator, serviceId, confirmation, simulate = true }) {
  const startedAt = Date.now();
  const service = findService(serviceId, true);

  if (!service) {
    const result = {
      status: "not_found",
      message: "Requested service was not found.",
      simulated: true,
      serviceId
    };

    recordOperatorAction({
      operator,
      action: "service.restart",
      target: String(serviceId || "unknown"),
      result: result.status,
      durationMs: elapsedMs(startedAt),
      metadata: result
    });

    return result;
  }

  if (!simulate) {
    const result = {
      status: "blocked",
      message: "Restart actions are restricted to SAFE MODE simulation in this phase.",
      simulated: true
    };

    recordOperatorAction({
      operator,
      action: "service.restart",
      target: service.id,
      result: "blocked",
      durationMs: elapsedMs(startedAt),
      metadata: result
    });

    return result;
  }

  if (!hasValidSafetyConfirmation(confirmation)) {
    const result = {
      status: "blocked",
      message: "Safety confirmation token is required for restart simulation.",
      simulated: true,
      confirmationRequired: true
    };

    recordOperatorAction({
      operator,
      action: "service.restart",
      target: service.id,
      result: "blocked",
      durationMs: elapsedMs(startedAt),
      metadata: result
    });

    return result;
  }

  const result = {
    status: "completed_simulation",
    message: "Restart simulation completed. No external service mutation occurred.",
    simulated: true,
    service: {
      id: service.id,
      name: service.name,
      runtime: service.runtime,
      lifecycleStatus: service.lifecycleStatus
    }
  };

  recordOperatorAction({
    operator,
    action: "service.restart",
    target: service.id,
    result: result.status,
    durationMs: elapsedMs(startedAt),
    metadata: {
      simulated: true,
      safeMode: true
    }
  });

  return result;
}
