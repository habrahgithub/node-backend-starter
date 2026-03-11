import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { env } from "../config/env.js";
import { seedRegistry } from "../config/seedData.js";
import { recordWarningEvent } from "./observability.js";

const SCAN_SKIP_DIRS = new Set([".git", "node_modules", ".next", "dist", "build", "coverage", "tmp", "output"]);

const REQUIRED_ASSET_HEADERS = [
  "project_name",
  "current_path",
  "project_type",
  "priority",
  "status",
  "framework",
  "target_group"
];

const REQUIRED_RECOVERY_HEADERS = ["project_name", "execution_type", "execution_readiness"];

const DEFAULT_AGENTS = [
  {
    id: "axis",
    name: "Axis",
    role: "governance",
    status: "active",
    currentTask: "Architecture veto and control-plane ownership",
    pipelineStage: "governance"
  },
  {
    id: "forge",
    name: "Forge",
    role: "execution",
    status: "active",
    currentTask: "ARC Console runtime validation and hardening",
    pipelineStage: "implementation"
  },
  {
    id: "sentinel",
    name: "Sentinel",
    role: "security",
    status: "standby",
    currentTask: "Security posture monitoring",
    pipelineStage: "security"
  },
  {
    id: "warden",
    name: "Warden",
    role: "audit",
    status: "standby",
    currentTask: "Evidence and governance logs",
    pipelineStage: "compliance"
  },
  {
    id: "cline",
    name: "Cline",
    role: "assistant",
    status: "paused",
    currentTask: "Awaiting governed remediation scope",
    pipelineStage: "analysis"
  }
];

let registryCache = {
  expiresAt: 0,
  data: null
};

function makeWarning(level, code, message, details = {}) {
  return {
    level,
    code,
    message,
    ...details
  };
}

function appendWarnings(target, warnings) {
  for (const warning of warnings) {
    target.push(warning);
  }
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);

  return {
    values,
    malformed: inQuotes
  };
}

function parseCsvFile(filePath, { label = "csv", requiredHeaders = [] } = {}) {
  const warnings = [];

  if (!fs.existsSync(filePath)) {
    warnings.push(
      makeWarning("warning", "csv_missing", `${label} file not found; fallback data may be used.`, {
        path: filePath
      })
    );
    return { rows: [], headers: [], warnings };
  }

  let content = "";
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    warnings.push(
      makeWarning("error", "csv_unreadable", `${label} could not be read.`, {
        path: filePath,
        reason: error.message
      })
    );
    return { rows: [], headers: [], warnings };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    warnings.push(
      makeWarning("warning", "csv_empty", `${label} is empty; fallback data may be used.`, {
        path: filePath
      })
    );
    return { rows: [], headers: [], warnings };
  }

  const lines = trimmed.split(/\r?\n/);
  const headerParse = parseCsvLine(lines[0]);
  const headers = headerParse.values.map((header) => String(header || "").trim());

  if (headerParse.malformed) {
    warnings.push(
      makeWarning("warning", "csv_header_malformed", `${label} header contains unbalanced quotes.`, {
        path: filePath
      })
    );
  }

  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    warnings.push(
      makeWarning("warning", "csv_header_missing", `${label} is missing expected headers.`, {
        path: filePath,
        missingHeaders
      })
    );
  }

  const rows = [];
  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    if (!line.trim()) {
      continue;
    }

    const parsed = parseCsvLine(line);
    if (parsed.malformed) {
      warnings.push(
        makeWarning("warning", "csv_row_malformed", `${label} has an unbalanced quoted row; row parsed with best effort.`, {
          path: filePath,
          row: lineIndex + 1
        })
      );
    }

    if (parsed.values.length !== headers.length) {
      warnings.push(
        makeWarning("warning", "csv_row_shape_mismatch", `${label} row has a different column count than header.`, {
          path: filePath,
          row: lineIndex + 1,
          expected: headers.length,
          actual: parsed.values.length
        })
      );
    }

    const row = {};
    headers.forEach((header, index) => {
      row[header] = String(parsed.values[index] ?? "").trim();
    });
    rows.push(row);
  }

  return { rows, headers, warnings };
}

function mapProjectStatusToRuntimeState(status) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "ACTIVE" || normalized === "STABLE") {
    return "operational";
  }

  if (normalized === "EXPERIMENT") {
    return "degraded";
  }

  if (normalized === "LEGACY") {
    return "legacy";
  }

  if (normalized === "TEMPLATE") {
    return "reference";
  }

  if (normalized === "ARCHIVE") {
    return "archived";
  }

  return "needs-review";
}

function detectRuntime(framework) {
  const lower = String(framework || "").toLowerCase();

  if (lower.includes("next.js")) {
    return "nextjs";
  }

  if (lower.includes("express")) {
    return "node-express";
  }

  if (lower.includes("mcp")) {
    return "node-mcp";
  }

  return "node";
}

function loadServiceCatalog() {
  const warnings = [];
  const assetResult = parseCsvFile(env.assetRegistryPath, {
    label: "asset_registry_v2",
    requiredHeaders: REQUIRED_ASSET_HEADERS
  });
  const recoveryResult = parseCsvFile(env.recoveryMovePlanPath, {
    label: "move_plan_v3",
    requiredHeaders: REQUIRED_RECOVERY_HEADERS
  });

  appendWarnings(warnings, assetResult.warnings);
  appendWarnings(warnings, recoveryResult.warnings);

  const recoveryByProject = new Map(
    recoveryResult.rows
      .filter((row) => row.project_name)
      .map((row) => [String(row.project_name).trim(), row])
  );

  const catalog = [];
  for (const row of assetResult.rows) {
    if (row.project_type === "archive" || row.project_type === "documentation") {
      continue;
    }

    const projectName = String(row.project_name || "").trim();
    if (!projectName) {
      warnings.push(
        makeWarning("warning", "asset_row_missing_project", "asset_registry_v2 row skipped due to missing project_name.")
      );
      continue;
    }

    const recovery = recoveryByProject.get(projectName);
    catalog.push({
      id: projectName,
      name: projectName,
      domain: row.target_group || row.project_type || "unknown",
      projectType: row.project_type || "unknown",
      status: mapProjectStatusToRuntimeState(row.status),
      lifecycleStatus: row.status || "NEEDS_REVIEW",
      runtime: detectRuntime(row.framework),
      owner: "unknown",
      path: row.current_path || "",
      priority: row.priority || "P3",
      executionType: recovery?.execution_type || "NEEDS_REVIEW",
      executionReadiness: recovery?.execution_readiness || "NEEDS_REVIEW"
    });
  }

  if (catalog.length === 0) {
    warnings.push(
      makeWarning("warning", "service_catalog_fallback", "No valid services resolved from artifact inputs; using seeded catalog.")
    );
    return {
      items: structuredClone(seedRegistry.services),
      warnings
    };
  }

  return {
    items: catalog,
    warnings
  };
}

function collectGitRepos(workspaceRoot, warnings) {
  const repos = [];
  const stack = [workspaceRoot];

  while (stack.length > 0) {
    const current = stack.pop();
    let entries = [];

    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (error) {
      warnings.push(
        makeWarning("warning", "repo_scan_read_failure", "Unable to read directory during repository scan.", {
          path: current,
          reason: error.message
        })
      );
      continue;
    }

    const hasGit = entries.some((entry) => entry.isDirectory() && entry.name === ".git");
    if (hasGit) {
      repos.push(current);
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || SCAN_SKIP_DIRS.has(entry.name)) {
        continue;
      }
      stack.push(path.join(current, entry.name));
    }
  }

  repos.sort((a, b) => a.localeCompare(b));
  return repos;
}

function summarizeStatusLines(lines) {
  const summary = {
    dirty: false,
    modified: 0,
    deleted: 0,
    untracked: 0
  };

  for (const line of lines) {
    const code = line.slice(0, 2);
    summary.dirty = true;

    if (code === "??") {
      summary.untracked += 1;
      continue;
    }

    if (code.includes("D")) {
      summary.deleted += 1;
      continue;
    }

    summary.modified += 1;
  }

  return summary;
}

function getRepoType(workspaceRoot, relativePath) {
  if (relativePath === ".") {
    return "monorepo";
  }

  const result = spawnSync("git", ["-C", workspaceRoot, "ls-files", "-s", "--", relativePath], {
    encoding: "utf8"
  });

  if (result.status !== 0 || !result.stdout.trim()) {
    return "nested-repo";
  }

  const lines = result.stdout.trim().split(/\r?\n/);
  const exact = lines.find((line) => line.endsWith(`\t${relativePath}`));

  if (!exact) {
    return "embedded-repo";
  }

  const mode = exact.split(/\s+/)[0];
  if (mode === "160000") {
    return "gitlink";
  }

  return "embedded-repo";
}

function loadRepositoryCatalog() {
  const warnings = [];
  const workspaceRoot = env.workspaceRoot;

  if (!fs.existsSync(workspaceRoot)) {
    warnings.push(
      makeWarning("warning", "workspace_root_missing", "Workspace root is unavailable; using seeded repository inventory.", {
        path: workspaceRoot
      })
    );
    return { items: structuredClone(seedRegistry.repositories), warnings };
  }

  const repoPaths = collectGitRepos(workspaceRoot, warnings);
  if (repoPaths.length === 0) {
    warnings.push(
      makeWarning("warning", "repo_scan_empty", "No repositories discovered from workspace scan; using seeded repository inventory.", {
        path: workspaceRoot
      })
    );
    return { items: structuredClone(seedRegistry.repositories), warnings };
  }

  const repositories = repoPaths.map((repoPath) => {
    const relativePath = path.relative(workspaceRoot, repoPath) || ".";
    const statusResult = spawnSync("git", ["-C", repoPath, "status", "--porcelain"], {
      encoding: "utf8"
    });

    if (statusResult.status !== 0) {
      warnings.push(
        makeWarning("warning", "repo_status_unavailable", "Repository dirty state could not be resolved via git status.", {
          path: repoPath,
          reason: (statusResult.stderr || "").trim() || "git status non-zero"
        })
      );
    }

    const lines = statusResult.status === 0 ? statusResult.stdout.split(/\r?\n/).filter(Boolean) : [];
    const summary = summarizeStatusLines(lines);

    return {
      id: relativePath === "." ? "workspace-root" : relativePath.replaceAll("/", "-"),
      name: relativePath === "." ? "Workspace Root" : path.basename(repoPath),
      path: repoPath,
      relativePath,
      status: statusResult.status === 0 ? (summary.dirty ? "dirty" : "clean") : "unknown",
      repoType: getRepoType(workspaceRoot, relativePath),
      dirtyCounts: {
        modified: summary.modified,
        deleted: summary.deleted,
        untracked: summary.untracked
      }
    };
  });

  return { items: repositories, warnings };
}

function normalizeAgent(raw, index) {
  return {
    id: String(raw.id || `agent-${index + 1}`).toLowerCase(),
    name: String(raw.name || `Agent ${index + 1}`),
    role: String(raw.role || "unknown"),
    status: String(raw.status || "standby"),
    currentTask: String(raw.currentTask || "No task reported"),
    pipelineStage: String(raw.pipelineStage || "unspecified")
  };
}

function loadAgentCatalog() {
  const warnings = [];
  const agentStatePath = env.agentStatePath;

  if (agentStatePath) {
    if (!fs.existsSync(agentStatePath)) {
      warnings.push(
        makeWarning("warning", "agent_state_missing", "Configured agent state file not found; using default agent profile.", {
          path: agentStatePath
        })
      );
      return { items: structuredClone(DEFAULT_AGENTS), warnings };
    }

    try {
      const parsed = JSON.parse(fs.readFileSync(agentStatePath, "utf8"));
      if (!Array.isArray(parsed) || parsed.length === 0) {
        warnings.push(
          makeWarning(
            "warning",
            "agent_state_empty",
            "Configured agent state file is empty or invalid; using default agent profile.",
            { path: agentStatePath }
          )
        );
        return { items: structuredClone(DEFAULT_AGENTS), warnings };
      }

      return {
        items: parsed.map(normalizeAgent),
        warnings
      };
    } catch (error) {
      warnings.push(
        makeWarning("warning", "agent_state_parse_failed", "Configured agent state file could not be parsed; using default agent profile.", {
          path: agentStatePath,
          reason: error.message
        })
      );
      return { items: structuredClone(DEFAULT_AGENTS), warnings };
    }
  }

  return { items: structuredClone(DEFAULT_AGENTS), warnings };
}

function buildHealthSeed(services, repositories, agents, warnings) {
  const serviceWarnings = services.filter((item) => item.status !== "operational").length;
  const repoWarnings = repositories.filter((item) => item.status === "dirty" || item.status === "unknown").length;
  const warningCount = serviceWarnings + repoWarnings + warnings.length;

  return {
    overall: warningCount > 0 ? "warning" : "healthy",
    summary:
      warningCount > 0
        ? "Live inventory shows unresolved warnings across service and repository governance."
        : "Live inventory indicates healthy platform posture.",
    metrics: {
      monitoredServices: services.length,
      dirtyRepositories: repositories.filter((item) => item.status === "dirty").length,
      unknownRepositories: repositories.filter((item) => item.status === "unknown").length,
      activeAgents: agents.filter((agent) => String(agent.status).toLowerCase() === "active").length,
      warningCount
    }
  };
}

function buildRegistrySnapshot() {
  const warnings = [];
  const serviceCatalog = loadServiceCatalog();
  const repositoryCatalog = loadRepositoryCatalog();
  const agentCatalog = loadAgentCatalog();

  appendWarnings(warnings, serviceCatalog.warnings);
  appendWarnings(warnings, repositoryCatalog.warnings);
  appendWarnings(warnings, agentCatalog.warnings);

  for (const warning of warnings) {
    recordWarningEvent({
      source: "systemRegistry",
      code: warning.code,
      message: warning.message,
      path: warning.path
    });
  }

  const services = serviceCatalog.items;
  const repositories = repositoryCatalog.items;
  const agents = agentCatalog.items;

  return {
    generatedAt: new Date().toISOString(),
    source: warnings.length > 0 ? `${env.registrySource}-degraded` : env.registrySource,
    services,
    repositories,
    agents,
    warnings,
    health_status: buildHealthSeed(services, repositories, agents, warnings)
  };
}

function buildFallbackRegistry(error) {
  const warnings = [
    makeWarning("error", "registry_build_failed", "Registry snapshot failed and fallback seed data was used.", {
      reason: error.message
    })
  ];

  for (const warning of warnings) {
    recordWarningEvent({
      source: "systemRegistry",
      code: warning.code,
      message: warning.message,
      path: warning.path
    });
  }

  const services = structuredClone(seedRegistry.services);
  const repositories = structuredClone(seedRegistry.repositories);
  const agents = structuredClone(DEFAULT_AGENTS);

  return {
    generatedAt: new Date().toISOString(),
    source: "seed-fallback",
    services,
    repositories,
    agents,
    warnings,
    health_status: buildHealthSeed(services, repositories, agents, warnings)
  };
}

function getCachedRegistry(forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && registryCache.data && now < registryCache.expiresAt) {
    return registryCache.data;
  }

  let nextData;
  try {
    nextData = buildRegistrySnapshot();
  } catch (error) {
    nextData = buildFallbackRegistry(error);
  }

  registryCache = {
    data: nextData,
    expiresAt: now + env.registryCacheTtlMs
  };

  return nextData;
}

export function getSystemRegistry(options = {}) {
  return getCachedRegistry(Boolean(options.forceRefresh));
}

export function getServices(options = {}) {
  return getSystemRegistry(options).services;
}

export function getRepositories(options = {}) {
  return getSystemRegistry(options).repositories;
}

export function getAgents(options = {}) {
  return getSystemRegistry(options).agents;
}

export function getHealthStatus(options = {}) {
  return getSystemRegistry(options).health_status;
}

export function getControlPlaneLogs(options = {}) {
  const registry = getSystemRegistry(options);
  const now = new Date().toISOString();

  const warningEvents = registry.warnings.slice(0, 10).map((warning, index) => ({
    id: `evt-warning-${index + 1}`,
    source: "systemRegistry",
    level: warning.level,
    message: warning.message,
    at: now,
    code: warning.code
  }));

  return [
    {
      id: "evt-registry-refresh",
      source: "systemRegistry",
      level: "info",
      message: `Registry snapshot generated from ${registry.source}`,
      at: now
    },
    {
      id: "evt-repo-dirty",
      source: "repoInventory",
      level: registry.health_status.metrics.dirtyRepositories > 0 ? "warning" : "info",
      message: `${registry.health_status.metrics.dirtyRepositories} repositories reported dirty state`,
      at: now
    },
    {
      id: "evt-agent-active",
      source: "agentController",
      level: "info",
      message: `${registry.health_status.metrics.activeAgents} agents currently active`,
      at: now
    },
    ...warningEvents
  ];
}
