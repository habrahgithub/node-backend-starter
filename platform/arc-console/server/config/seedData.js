export const seedRegistry = {
  services: [
    {
      id: "swd-pulse",
      name: "SWD Pulse",
      domain: "platform",
      status: "operational",
      runtime: "node",
      owner: "Forge"
    },
    {
      id: "docsmith-licensing-service",
      name: "DocSmith Licensing Service",
      domain: "services",
      status: "needs-review",
      runtime: "nextjs",
      owner: "unknown"
    },
    {
      id: "docsmith-payment-gateway",
      name: "DocSmith Payment Gateway",
      domain: "services",
      status: "operational",
      runtime: "nextjs",
      owner: "unknown"
    },
    {
      id: "swd-finstack-mcp-server",
      name: "SWD Finstack MCP Server",
      domain: "tooling",
      status: "degraded",
      runtime: "node",
      owner: "unknown"
    }
  ],
  repositories: [
    {
      id: "workspace-root",
      name: "Workspace Root",
      path: "/home/habib/workspace",
      status: "dirty",
      repoType: "monorepo"
    },
    {
      id: "swd-arc",
      name: "SWD-ARC",
      path: "/home/habib/workspace/projects/SWD-ARC",
      status: "dirty",
      repoType: "nested-repo"
    },
    {
      id: "docsmith-licensing-service",
      name: "DocSmith Licensing Service Repo",
      path: "/home/habib/workspace/projects/docsmith-licensing-service",
      status: "dirty",
      repoType: "gitlink"
    },
    {
      id: "docsmith-payment-gateway",
      name: "DocSmith Payment Gateway Repo",
      path: "/home/habib/workspace/projects/docsmith-payment-gateway",
      status: "clean",
      repoType: "gitlink"
    }
  ],
  agents: [
    {
      id: "axis",
      name: "Axis",
      role: "governance",
      status: "active",
      currentTask: "Architectural veto and directive control",
      pipelineStage: "governance"
    },
    {
      id: "forge",
      name: "Forge",
      role: "execution",
      status: "active",
      currentTask: "ARC console initialization",
      pipelineStage: "implementation"
    },
    {
      id: "sentinel",
      name: "Sentinel",
      role: "security",
      status: "standby",
      currentTask: "Security review queue",
      pipelineStage: "security"
    },
    {
      id: "warden",
      name: "Warden",
      role: "audit",
      status: "standby",
      currentTask: "Evidence retention",
      pipelineStage: "compliance"
    },
    {
      id: "cline",
      name: "Cline",
      role: "assistant",
      status: "paused",
      currentTask: "Awaiting remediation orders",
      pipelineStage: "analysis"
    }
  ],
  health_status: {
    overall: "warning",
    summary: "Seeded status reflects a dirty workspace and pending consolidation decisions.",
    metrics: {
      monitoredServices: 4,
      dirtyRepositories: 3,
      activeAgents: 2,
      warningCount: 3
    }
  }
};
