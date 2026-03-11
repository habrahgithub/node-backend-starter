import { env } from "../config/env.js";
import { getPlatformHealth } from "../services/healthMonitor.js";
import { recordOperatorAction } from "../services/observability.js";
import { getSystemRegistry } from "../services/systemRegistry.js";
import { listAgentState } from "./agentOrchestrator.js";
import { getDependencyRisk, getRepositoryHealth, getStaleBranches } from "./repoGovernor.js";
import { getServiceMetrics } from "./serviceController.js";

const WORKFLOWS = [
  {
    id: "system-scan",
    title: "System Scan",
    description: "Refresh registry and health posture in a single safe workflow.",
    prerequisites: ["authenticated_operator", "readable_registry"]
  },
  {
    id: "repo-audit",
    title: "Repository Audit",
    description: "Review repo health, stale branches, and dependency risk signals.",
    prerequisites: ["authenticated_operator", "repo_inventory_available"]
  },
  {
    id: "agent-health-check",
    title: "Agent Health Check",
    description: "Validate managed agent state and pipeline stage visibility.",
    prerequisites: ["authenticated_operator", "agent_registry_available"]
  },
  {
    id: "platform-health-check",
    title: "Platform Health Check",
    description: "Aggregate service metrics and platform-health signals.",
    prerequisites: ["authenticated_operator", "service_registry_available"]
  }
];

function elapsedMs(startedAt) {
  return Number((Date.now() - startedAt).toFixed(2));
}

function findWorkflow(workflowId) {
  return WORKFLOWS.find((workflow) => workflow.id === String(workflowId || "").trim().toLowerCase());
}

function validatePrerequisites(workflowId) {
  const registry = getSystemRegistry({ forceRefresh: false });

  if (workflowId === "repo-audit" && (registry.repositories || []).length === 0) {
    return {
      ok: false,
      reason: "Repository inventory is empty."
    };
  }

  if (workflowId === "agent-health-check" && (registry.agents || []).length === 0) {
    return {
      ok: false,
      reason: "Agent inventory is empty."
    };
  }

  if (workflowId === "platform-health-check" && (registry.services || []).length === 0) {
    return {
      ok: false,
      reason: "Service inventory is empty."
    };
  }

  return {
    ok: true,
    reason: "ok"
  };
}

function executeWorkflow(workflowId) {
  if (workflowId === "system-scan") {
    const registry = getSystemRegistry({ forceRefresh: true });
    const health = getPlatformHealth({ forceRefresh: true });

    return {
      workflowId,
      summary: "System scan completed with refreshed registry and platform health.",
      outputs: {
        services: registry.services.length,
        repositories: registry.repositories.length,
        agents: registry.agents.length,
        warnings: registry.warnings.length,
        healthOverall: health.overall
      }
    };
  }

  if (workflowId === "repo-audit") {
    const repoHealth = getRepositoryHealth({ forceRefresh: true });
    const staleBranches = getStaleBranches({ forceRefresh: true });
    const dependencyRisk = getDependencyRisk({ forceRefresh: true });

    return {
      workflowId,
      summary: "Repository audit completed with health, stale-branch, and dependency-risk scans.",
      outputs: {
        repositories: repoHealth.summary.total,
        criticalRepos: repoHealth.summary.critical,
        staleRepos: staleBranches.summary.withStaleBranches,
        highDependencyRisk: dependencyRisk.summary.high
      }
    };
  }

  if (workflowId === "agent-health-check") {
    const agents = listAgentState({ forceRefresh: true });

    return {
      workflowId,
      summary: "Agent health check completed.",
      outputs: {
        total: agents.summary.total,
        active: agents.summary.active,
        supported: agents.summary.supported
      }
    };
  }

  const serviceMetrics = getServiceMetrics({ forceRefresh: true });
  const health = getPlatformHealth({ forceRefresh: true });

  return {
    workflowId,
    summary: "Platform health check completed.",
    outputs: {
      services: serviceMetrics.summary.total,
      degraded: serviceMetrics.summary.degraded,
      overallHealth: health.overall
    }
  };
}

export function getWorkflows() {
  return {
    generatedAt: new Date().toISOString(),
    mode: "operator_triggered",
    safeMode: true,
    items: WORKFLOWS
  };
}

export function runWorkflow({ operator, workflowId, confirmation }) {
  const startedAt = Date.now();
  const workflow = findWorkflow(workflowId);

  if (!workflow) {
    const result = {
      status: "not_found",
      message: "Requested workflow is not defined.",
      workflowId
    };

    recordOperatorAction({
      operator,
      action: "workflow.run",
      target: String(workflowId || "unknown"),
      result: "not_found",
      durationMs: elapsedMs(startedAt),
      metadata: result
    });

    return result;
  }

  if (String(confirmation || "") !== env.workflowSafetyConfirmationToken) {
    const result = {
      status: "blocked",
      message: "Safety confirmation token is required for workflow execution.",
      workflowId: workflow.id,
      confirmationRequired: true
    };

    recordOperatorAction({
      operator,
      action: "workflow.run",
      target: workflow.id,
      result: "blocked",
      durationMs: elapsedMs(startedAt),
      metadata: result
    });

    return result;
  }

  const prerequisite = validatePrerequisites(workflow.id);
  if (!prerequisite.ok) {
    const result = {
      status: "blocked",
      message: prerequisite.reason,
      workflowId: workflow.id,
      confirmationRequired: false
    };

    recordOperatorAction({
      operator,
      action: "workflow.run",
      target: workflow.id,
      result: "blocked",
      durationMs: elapsedMs(startedAt),
      metadata: result
    });

    return result;
  }

  const execution = executeWorkflow(workflow.id);

  const result = {
    status: "completed",
    mode: "safe_read_only",
    workflow: {
      id: workflow.id,
      title: workflow.title
    },
    ...execution
  };

  recordOperatorAction({
    operator,
    action: "workflow.run",
    target: workflow.id,
    result: "completed",
    durationMs: elapsedMs(startedAt),
    metadata: {
      mode: "safe_read_only",
      outputKeys: Object.keys(execution.outputs || {})
    }
  });

  return result;
}
