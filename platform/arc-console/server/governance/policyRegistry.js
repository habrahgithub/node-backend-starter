import fs from "fs";
import { env } from "../config/env.js";

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeSeverity(value) {
  const normalized = String(value || "low").toLowerCase();
  if (["critical", "high", "medium", "low"].includes(normalized)) {
    return normalized;
  }
  return "low";
}

function normalizePolicy(item) {
  const policyId = String(item?.policy_id || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._:-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  return {
    policy_id: policyId,
    description: String(item?.description || "").trim().slice(0, 500),
    evaluation_target: String(item?.evaluation_target || "unknown").trim().slice(0, 120),
    severity: normalizeSeverity(item?.severity),
    threshold: typeof item?.threshold === "object" && item.threshold ? item.threshold : {},
    enabled: item?.enabled !== false
  };
}

function defaultPolicies() {
  return [
    {
      policy_id: "node_heartbeat_threshold",
      description: "Nodes must report heartbeat within configured thresholds.",
      evaluation_target: "fabric_nodes",
      severity: "high",
      threshold: {
        max_offline_nodes: Math.max(0, Number(env.governanceHeartbeatMaxOfflineNodes || 0)),
        max_degraded_nodes: Math.max(0, Number(env.governanceHeartbeatMaxDegradedNodes || 0))
      },
      enabled: true
    },
    {
      policy_id: "service_health_exposure",
      description: "Services must remain available and expose healthy status signals.",
      evaluation_target: "services",
      severity: "high",
      threshold: {
        max_degraded_services: Math.max(0, Number(env.governanceServiceMaxDegradedServices || 0))
      },
      enabled: true
    },
    {
      policy_id: "repo_stale_branches_limit",
      description: "Repositories must not exceed stale branch threshold.",
      evaluation_target: "repositories",
      severity: "medium",
      threshold: {
        max_repositories_with_stale_branches: Math.max(0, Number(env.governanceRepoMaxStaleRepositories || 0))
      },
      enabled: true
    },
    {
      policy_id: "dependency_risk_limit",
      description: "High-risk dependencies must stay below configured threshold.",
      evaluation_target: "dependencies",
      severity: "medium",
      threshold: {
        max_high_risk_dependencies: Math.max(0, Number(env.governanceDependencyMaxHighRisk || 0))
      },
      enabled: true
    },
    {
      policy_id: "agent_activity_window",
      description: "Agents should report activity and avoid stalled execution windows.",
      evaluation_target: "agents",
      severity: "medium",
      threshold: {
        max_stalled_agents: Math.max(0, Number(env.governanceAgentMaxStalledAgents || 0))
      },
      enabled: true
    }
  ];
}

function loadPolicyOverridesFromFile() {
  if (!env.governancePolicyFilePath) {
    return [];
  }

  if (!fs.existsSync(env.governancePolicyFilePath)) {
    return [];
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(env.governancePolicyFilePath, "utf8"));
    const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.policies) ? parsed.policies : [];
    return rows.map((row) => normalizePolicy(row)).filter((row) => row.policy_id);
  } catch {
    return [];
  }
}

function mergePolicies(base, overrides) {
  if (!Array.isArray(overrides) || overrides.length === 0) {
    return base;
  }

  const byId = new Map(base.map((item) => [item.policy_id, item]));

  for (const override of overrides) {
    const current = byId.get(override.policy_id);

    if (!current) {
      byId.set(override.policy_id, override);
      continue;
    }

    byId.set(override.policy_id, {
      ...current,
      ...override,
      threshold: {
        ...(current.threshold || {}),
        ...(override.threshold || {})
      }
    });
  }

  return Array.from(byId.values());
}

export function loadGovernancePolicies({ includeDisabled = true } = {}) {
  const base = defaultPolicies().map((item) => normalizePolicy(item));
  const overrides = loadPolicyOverridesFromFile();
  const merged = mergePolicies(base, overrides).filter((item) => item.policy_id);

  if (includeDisabled) {
    return merged;
  }

  return merged.filter((item) => item.enabled !== false);
}

export function listActiveGovernancePolicies() {
  return loadGovernancePolicies({ includeDisabled: false });
}

export function getGovernancePolicies() {
  const items = loadGovernancePolicies({ includeDisabled: true });

  return {
    generatedAt: new Date().toISOString(),
    mode: "policy_registry",
    items,
    summary: {
      total: items.length,
      active: items.filter((item) => item.enabled !== false).length,
      disabled: items.filter((item) => item.enabled === false).length
    }
  };
}

export function getDefaultGovernancePolicies() {
  return deepClone(defaultPolicies());
}
