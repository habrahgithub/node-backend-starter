import path from "path";

const projectRoot = process.cwd();
const environment = process.env.ARC_CONSOLE_ENV || process.env.NODE_ENV || "development";
const defaultCredentialsAllowedByEnvironment = environment === "production" ? "false" : "true";

export const env = {
  port: Number(process.env.PORT || 4015),
  host: process.env.HOST || "0.0.0.0",
  dashboardPort: Number(process.env.DASHBOARD_PORT || 4110),
  consoleName: process.env.ARC_CONSOLE_NAME || "ARC Control Console",
  environment,
  registrySource: process.env.ARC_REGISTRY_SOURCE || "live",
  healthSource: process.env.ARC_HEALTH_SOURCE || "live",
  logLevel: process.env.ARC_LOG_LEVEL || "info",
  workspaceRoot: process.env.WORKSPACE_ROOT || "/home/habib/workspace",
  assetRegistryPath:
    process.env.ASSET_REGISTRY_PATH ||
    path.join("/home/habib/workspace", "operation-clean", "classification", "asset_registry_v2.csv"),
  recoveryMovePlanPath:
    process.env.MOVE_PLAN_RECOVERY_PATH ||
    path.join("/home/habib/workspace", "operation-clean", "recovery", "move_plan_v3.csv"),
  recoveryBacklogPath:
    process.env.RECOVERY_BACKLOG_PATH ||
    path.join("/home/habib/workspace", "operation-clean", "recovery", "migration_backlog.md"),
  agentStatePath: process.env.AGENT_STATE_PATH || "",
  operatorUsername: process.env.ARC_OPERATOR_USERNAME || "operator",
  operatorPassword: process.env.ARC_OPERATOR_PASSWORD || "operator-local-change-me",
  sessionSecret: process.env.ARC_SESSION_SECRET || "arc-console-local-session-secret-change-me",
  previousSessionSecrets: String(process.env.ARC_SESSION_PREVIOUS_SECRETS || "")
    .split(",")
    .map((secret) => secret.trim())
    .filter(Boolean),
  sessionTtlSeconds: Number(process.env.ARC_SESSION_TTL_SECONDS || 43200),
  allowDefaultCredentials:
    String(process.env.ARC_ALLOW_DEFAULT_CREDENTIALS || defaultCredentialsAllowedByEnvironment) === "true",
  authRateWindowMs: Number(process.env.ARC_AUTH_RATE_WINDOW_MS || 300000),
  authMaxAttempts: Number(process.env.ARC_AUTH_MAX_ATTEMPTS || 5),
  authBlockSeconds: Number(process.env.ARC_AUTH_BLOCK_SECONDS || 600),
  serviceSafetyConfirmationToken: process.env.ARC_SERVICE_CONFIRMATION_TOKEN || "SAFE_MODE_ACK",
  workflowSafetyConfirmationToken: process.env.ARC_WORKFLOW_CONFIRMATION_TOKEN || "SAFE_MODE_ACK",
  repoStaleDays: Number(process.env.ARC_REPO_STALE_DAYS || 45),
  operatorActionLogPath:
    process.env.OPERATOR_ACTION_LOG_PATH || path.join(projectRoot, "logs", "operator-actions.log"),
  reliabilityLearningLedgerPath:
    process.env.RELIABILITY_LEARNING_LEDGER_PATH || path.join(projectRoot, "data", "incident-learning-ledger.json"),
  copilotConversationStorePath:
    process.env.COPILOT_CONVERSATION_STORE_PATH || path.join(projectRoot, "data", "copilot-conversations.json"),
  copilotContextTimeoutMs: Number(process.env.COPILOT_CONTEXT_TIMEOUT_MS || 2500),
  governancePolicyFilePath: process.env.GOVERNANCE_POLICY_FILE_PATH || "",
  governanceComplianceHistoryPath:
    process.env.GOVERNANCE_COMPLIANCE_HISTORY_PATH || path.join(projectRoot, "data", "governance-compliance-history.json"),
  governanceHeartbeatMaxOfflineNodes: Number(process.env.GOVERNANCE_HEARTBEAT_MAX_OFFLINE_NODES || 0),
  governanceHeartbeatMaxDegradedNodes: Number(process.env.GOVERNANCE_HEARTBEAT_MAX_DEGRADED_NODES || 0),
  governanceServiceMaxDegradedServices: Number(process.env.GOVERNANCE_SERVICE_MAX_DEGRADED_SERVICES || 0),
  governanceRepoMaxStaleRepositories: Number(process.env.GOVERNANCE_REPO_MAX_STALE_REPOSITORIES || 0),
  governanceDependencyMaxHighRisk: Number(process.env.GOVERNANCE_DEPENDENCY_MAX_HIGH_RISK || 0),
  governanceAgentMaxStalledAgents: Number(process.env.GOVERNANCE_AGENT_MAX_STALLED_AGENTS || 0),
  fabricNodeRegistryPath:
    process.env.FABRIC_NODE_REGISTRY_PATH || path.join(projectRoot, "data", "fabric-node-registry.json"),
  fabricTelemetryStorePath:
    process.env.FABRIC_TELEMETRY_STORE_PATH || path.join(projectRoot, "data", "fabric-telemetry-store.json"),
  fabricNodeRegistrationToken: process.env.FABRIC_NODE_REGISTRATION_TOKEN || "FABRIC_NODE_LOCAL_TOKEN",
  fabricHeartbeatDegradedSeconds: Number(process.env.FABRIC_HEARTBEAT_DEGRADED_SECONDS || 60),
  fabricHeartbeatOfflineSeconds: Number(process.env.FABRIC_HEARTBEAT_OFFLINE_SECONDS || 180),
  agentStateEndpoint: process.env.AGENT_STATE_ENDPOINT || "",
  serviceHeartbeatEndpoint: process.env.SERVICE_HEARTBEAT_ENDPOINT || "",
  integrationFetchTimeoutMs: Number(process.env.INTEGRATION_FETCH_TIMEOUT_MS || 4000),
  registryCacheTtlMs: Number(process.env.REGISTRY_CACHE_TTL_MS || 15000),
  serveDashboard: String(process.env.SERVE_DASHBOARD || "true") === "true",
  projectRoot
};
