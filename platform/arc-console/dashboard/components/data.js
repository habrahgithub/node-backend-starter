export const overview = {
  platformStatus: "Warning",
  activeServices: 4,
  dirtyRepos: 3,
  activeAgents: 2,
  summary: "Unified ARC server scaffold is active with seeded registry data."
};

export const services = [
  { id: "svc-1", name: "SWD Pulse", status: "Operational", owner: "Forge", runtime: "Node" },
  { id: "svc-2", name: "DocSmith Licensing", status: "Needs Review", owner: "Unknown", runtime: "Next.js" },
  { id: "svc-3", name: "DocSmith Gateway", status: "Operational", owner: "Unknown", runtime: "Next.js" },
  { id: "svc-4", name: "Finstack MCP", status: "Degraded", owner: "Unknown", runtime: "Node" }
];

export const repositories = [
  { id: "repo-1", name: "Workspace Root", status: "Dirty", boundary: "Monorepo" },
  { id: "repo-2", name: "SWD-ARC", status: "Dirty", boundary: "Gitlink" },
  { id: "repo-3", name: "DocSmith Licensing", status: "Dirty", boundary: "Gitlink" },
  { id: "repo-4", name: "DocSmith Gateway", status: "Clean", boundary: "Gitlink" }
];

export const agents = [
  { id: "agent-1", name: "Axis", status: "Active", stage: "Governance" },
  { id: "agent-2", name: "Forge", status: "Active", stage: "Implementation" },
  { id: "agent-3", name: "Sentinel", status: "Standby", stage: "Security" },
  { id: "agent-4", name: "Warden", status: "Standby", stage: "Compliance" },
  { id: "agent-5", name: "Cline", status: "Paused", stage: "Analysis" }
];

export const securitySignals = [
  "Vault integration remains a planned follow-up integration.",
  "Workspace dirty-state tracking should surface as a high-visibility warning.",
  "Agent actions should remain governance-gated by Axis directives."
];

export const logEvents = [
  { id: "log-1", source: "arc-console", level: "info", message: "Unified server scaffold initialized" },
  { id: "log-2", source: "systemRegistry", level: "warning", message: "Seed data active until live integrations are approved" },
  { id: "log-3", source: "healthMonitor", level: "warning", message: "Workspace contains unresolved dirty repositories" }
];
