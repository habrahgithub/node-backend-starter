function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function summarizeSystem(context) {
  const system = context.data.system || {};
  const health = context.data.health || {};

  const services = safeArray(system.services || system.registry?.services);
  const repositories = safeArray(system.repositories || system.registry?.repositories);
  const warnings = safeArray(system.warnings);

  const facts = [
    `Monitored services: ${services.length}`,
    `Monitored repositories: ${repositories.length}`,
    `Platform health: ${health.overall || "unknown"}`,
    `Current warnings: ${warnings.length}`
  ];

  const inferences = [];
  if ((health.repositoryActivity?.dirty || 0) > 0) {
    inferences.push("Dirty repository state may increase operational risk.");
  }
  if ((health.serviceAvailability?.degraded || 0) > 0) {
    inferences.push("Degraded services suggest active reliability concerns.");
  }

  const recommended = [
    "Review top warning sources and confirm if any need governed remediation.",
    "Run system-scan workflow if status appears outdated."
  ];

  return {
    answer: "Platform status reviewed. Current health and governance warnings are summarized below.",
    facts,
    inferences,
    recommended_actions: recommended
  };
}

function summarizeServiceDiagnostics(context) {
  const trends = safeArray(context.data.service_trends?.items);
  const diagnostics = safeArray(context.data.assistance_diagnostics?.items);
  const recovery = safeArray(context.data.recovery_advice?.items || context.data.reliability_recovery_advice?.items);

  const unstable = trends.filter((item) => item.health_trend !== "stable" || Number(item.stability_score || 100) < 75);

  const facts = [
    `Services analyzed: ${trends.length}`,
    `Potentially unstable services: ${unstable.length}`,
    `Diagnostic guidance items: ${diagnostics.length}`,
    `Recovery guidance items: ${recovery.length}`
  ];

  const inferences = unstable.slice(0, 4).map(
    (item) => `${item.service} shows ${item.health_trend} trend with stability ${item.stability_score}.`
  );

  const recommended_actions = unstable.slice(0, 4).map(
    (item) => `Run diagnostic copilot steps for ${item.service} and review operator-approved recovery advice.`
  );

  if (recommended_actions.length === 0) {
    recommended_actions.push("Continue monitoring service trends; no immediate high-risk instability detected.");
  }

  return {
    answer: "Service diagnostic context assembled with trend, copilot, and recovery signals.",
    facts,
    inferences,
    recommended_actions
  };
}

function summarizeRepoGovernance(context) {
  const drift = safeArray(context.data.repo_drift?.items);
  const dependency = safeArray(context.data.dependency_risk?.items);
  const repoAdvice = safeArray(context.data.assistance_repo_advice?.items);
  const governanceViolations = safeArray(context.data.governance_violations?.items);
  const governanceDrift = safeArray(context.data.governance_drift?.items);
  const compliance = context.data.governance_compliance || {};

  const highDrift = drift.filter((item) => item.risk_level === "high");
  const riskyDeps = dependency.filter((item) => item.risk_level === "high" || item.risk_level === "medium");
  const highGovernance = governanceViolations.filter((item) => item.severity === "high" || item.severity === "critical");
  const driftHigh = governanceDrift.filter((item) => item.severity === "high");

  return {
    answer: "Repository governance analysis completed using drift and dependency signals.",
    facts: [
      `Drift findings: ${drift.length}`,
      `High-drift repositories: ${highDrift.length}`,
      `Dependency risk findings: ${dependency.length}`,
      `Repository advisory items: ${repoAdvice.length}`,
      `Governance violations: ${governanceViolations.length}`,
      `Governance drift findings: ${governanceDrift.length}`,
      `Compliance score: ${compliance.overall_score ?? "unknown"}`
    ],
    inferences: [
      ...highDrift.slice(0, 4).map((item) => `${item.repository} may require governed cleanup due to ${item.drift_type}.`),
      ...highGovernance.slice(0, 3).map((item) => `${item.component} violates ${item.policy} at ${item.severity} severity.`)
    ],
    recommended_actions: [
      ...(highDrift.length > 0
        ? highDrift.slice(0, 4).map((item) => `Run repo-audit workflow for ${item.repository} and validate cleanup plan.`)
        : []),
      ...(highGovernance.length > 0
        ? highGovernance.slice(0, 3).map((item) => item.recommended_action || "Review governance policy violations.")
        : []),
      ...(driftHigh.length > 0
        ? ["Review governance drift findings and approve targeted remediation workflow."]
        : []),
      ...(riskyDeps.length > 0 ? ["Review medium/high dependency risks under governance policy thresholds."] : []),
      ...(highDrift.length === 0 && highGovernance.length === 0 && driftHigh.length === 0
        ? ["Continue scheduled repo governance checks; no high drift currently detected."]
        : [])
    ]
  };
}

function summarizeIncidents(context) {
  const incidents = safeArray(context.data.reliability_incidents?.items);
  const trends = safeArray(context.data.reliability_trends?.items);
  const playbooks = safeArray(context.data.reliability_playbooks?.items);

  const high = incidents.filter((item) => item.severity === "high");

  return {
    answer: "Incident analysis correlated with reliability trends and playbook availability.",
    facts: [
      `Incidents detected: ${incidents.length}`,
      `High-severity incidents: ${high.length}`,
      `Reliability trend rows: ${trends.length}`,
      `Available playbooks: ${playbooks.length}`
    ],
    inferences: high.slice(0, 4).map(
      (item) => `${item.service} shows recurring ${item.pattern_type} pattern (${item.occurrence_count} occurrences).`
    ),
    recommended_actions:
      high.length > 0
        ? high.slice(0, 4).map((item) => `Review incident ${item.incident_id} playbook and approve guided mitigation steps.`)
        : ["No high-severity incident pattern detected right now."]
  };
}

function summarizePlaybooks(context) {
  const playbooks = safeArray(context.data.reliability_playbooks?.items);
  const recovery = safeArray(context.data.reliability_recovery_advice?.items);

  return {
    answer: "Playbook lookup completed with recovery advisory context.",
    facts: [
      `Playbooks available: ${playbooks.length}`,
      `Recovery advisories available: ${recovery.length}`,
      `Approval-required playbooks: ${playbooks.filter((item) => item.approval_required).length}`
    ],
    inferences: playbooks.slice(0, 4).map((item) => `${item.playbook_title} is available for ${item.service}.`),
    recommended_actions:
      playbooks.length > 0
        ? ["Select the relevant incident playbook and verify prerequisites before approving execution steps."]
        : ["No active incident playbooks available; continue monitoring incidents endpoint."]
  };
}

function summarizeWorkflow(context) {
  const guidance = safeArray(context.data.assistance_workflows?.items);
  const insights = safeArray(context.data.assistance_insights?.items);

  return {
    answer: "Workflow recommendation context assembled from assistance and insight layers.",
    facts: [
      `Workflow suggestions: ${guidance.length}`,
      `Insight guidance items: ${insights.length}`,
      `Approval-required workflow suggestions: ${guidance.filter((item) => item.operator_approval_required).length}`
    ],
    inferences: guidance.slice(0, 4).map((item) => `${item.workflow} suggested for ${item.domain} domain risk.`),
    recommended_actions:
      guidance.length > 0
        ? guidance.slice(0, 4).map((item) => `Consider running ${item.workflow} after operator approval.`)
        : ["No immediate workflow recommendations available."]
  };
}

function summarizeGraph(context) {
  const graph = context.data.knowledge_graph || {};
  const relationships = context.data.knowledge_relationships || {};
  const nodes = context.data.knowledge_nodes || {};

  const nodeCount = Number(graph.metadata?.node_count || nodes.summary?.total || 0);
  const edgeCount = Number(graph.metadata?.relationship_count || relationships.summary?.total || 0);

  return {
    answer: "Knowledge graph context assembled for relationship-aware reasoning.",
    facts: [
      `Graph nodes: ${nodeCount}`,
      `Graph relationships: ${edgeCount}`,
      `Orphan nodes: ${graph.metadata?.orphan_node_count ?? 0}`,
      `Missing references: ${graph.metadata?.missing_reference_count ?? 0}`
    ],
    inferences: [
      edgeCount === 0
        ? "Graph currently has no relationships; source data may be sparse."
        : "Graph relationships can be used to trace service->repository and incident/workflow impact chains."
    ],
    recommended_actions: [
      "Use service-map and repo-map views to inspect relationship chains for current risks.",
      "Run targeted knowledge queries for service or repository names if you need deeper context."
    ]
  };
}

function summarizeGeneral(context) {
  const insights = safeArray(context.data.intelligence_insights?.top_risks);
  const assistance = safeArray(context.data.assistance_insights?.items);
  const reliability = safeArray(context.data.reliability_trends?.items);

  return {
    answer: "Cross-layer context assembled from system, intelligence, assistance, reliability, and graph data.",
    facts: [
      `Top intelligence risks: ${insights.length}`,
      `Assistance guidance items: ${assistance.length}`,
      `Reliability trend entries: ${reliability.length}`,
      `Context sources loaded: ${context.evidenceSources.length}`
    ],
    inferences: insights.slice(0, 4).map((risk) => `${risk.domain} risk detected for ${risk.subject}.`),
    recommended_actions:
      insights.length > 0
        ? ["Review top risks and choose one operator-approved workflow for next step validation."]
        : ["No top-risk entries currently detected; continue routine monitoring."]
  };
}

export function generateCopilotReasoning({ queryType, context }) {
  let summary;

  if (queryType === "system_status") {
    summary = summarizeSystem(context);
  } else if (queryType === "service_diagnostics") {
    summary = summarizeServiceDiagnostics(context);
  } else if (queryType === "repo_governance" || queryType === "dependency_risk") {
    summary = summarizeRepoGovernance(context);
  } else if (queryType === "incident_analysis") {
    summary = summarizeIncidents(context);
  } else if (queryType === "playbook_lookup") {
    summary = summarizePlaybooks(context);
  } else if (queryType === "workflow_suggestion") {
    summary = summarizeWorkflow(context);
  } else if (queryType === "graph_relationship") {
    summary = summarizeGraph(context);
  } else {
    summary = summarizeGeneral(context);
  }

  const facts = summary.facts || [];
  const inferences = summary.inferences || [];
  const recommended = summary.recommended_actions || [];

  const warningPenalty = Math.min(0.28, (context.warnings?.length || 0) * 0.06);
  const sourceBonus = Math.min(0.2, (context.evidenceSources?.length || 0) * 0.03);
  const confidence = Number(Math.max(0.25, Math.min(0.95, 0.62 + sourceBonus - warningPenalty)).toFixed(2));

  let actionMode = "informational";
  if (recommended.length > 0) {
    actionMode = "advisory";
  }

  if (recommended.some((item) => /approve|approval|run/i.test(String(item)))) {
    actionMode = "approval-required";
  }

  return {
    answer: summary.answer,
    facts,
    inferences,
    recommended_actions: recommended,
    confidence,
    action_mode: actionMode,
    evidence_sources: context.evidenceSources || [],
    warnings: context.warnings || []
  };
}
