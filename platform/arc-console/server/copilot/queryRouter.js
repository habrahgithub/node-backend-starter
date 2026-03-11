const QUERY_TYPES = {
  SYSTEM_STATUS: "system_status",
  SERVICE_DIAGNOSTICS: "service_diagnostics",
  REPO_GOVERNANCE: "repo_governance",
  DEPENDENCY_RISK: "dependency_risk",
  INCIDENT_ANALYSIS: "incident_analysis",
  PLAYBOOK_LOOKUP: "playbook_lookup",
  WORKFLOW_SUGGESTION: "workflow_suggestion",
  GRAPH_RELATIONSHIP: "graph_relationship",
  GENERAL: "general"
};

function containsAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function classifyCopilotQuery(query) {
  const normalized = String(query || "").toLowerCase();

  if (containsAny(normalized, ["graph", "relationship", "depends on", "connected", "impact chain", "map"])) {
    return QUERY_TYPES.GRAPH_RELATIONSHIP;
  }

  if (containsAny(normalized, ["incident", "failure", "outage", "playbook", "recover", "recovery", "self-healing"])) {
    if (containsAny(normalized, ["playbook", "remediation"])) {
      return QUERY_TYPES.PLAYBOOK_LOOKUP;
    }

    return QUERY_TYPES.INCIDENT_ANALYSIS;
  }

  if (containsAny(normalized, ["dependency", "package", "upgrade", "version", "lockfile"])) {
    return QUERY_TYPES.DEPENDENCY_RISK;
  }

  if (containsAny(normalized, ["repository", "repo", "governance", "drift", "branch", "cleanup"])) {
    return QUERY_TYPES.REPO_GOVERNANCE;
  }

  if (containsAny(normalized, ["diagnostic", "unstable", "service", "health", "degraded", "restart"])) {
    return QUERY_TYPES.SERVICE_DIAGNOSTICS;
  }

  if (containsAny(normalized, ["workflow", "next action", "what should i run", "run next", "suggest action"])) {
    return QUERY_TYPES.WORKFLOW_SUGGESTION;
  }

  if (containsAny(normalized, ["status", "overview", "summary", "platform state", "what is happening"])) {
    return QUERY_TYPES.SYSTEM_STATUS;
  }

  return QUERY_TYPES.GENERAL;
}

const SOURCE_MAP = {
  [QUERY_TYPES.SYSTEM_STATUS]: ["system", "health", "governance", "intelligence_insights"],
  [QUERY_TYPES.SERVICE_DIAGNOSTICS]: [
    "service_trends",
    "assistance_diagnostics",
    "reliability_trends",
    "reliability_recovery_advice"
  ],
  [QUERY_TYPES.REPO_GOVERNANCE]: [
    "repo_drift",
    "dependency_risk",
    "assistance_repo_advice",
    "knowledge_graph",
    "governance_policies",
    "governance_evaluation",
    "governance_drift",
    "governance_compliance",
    "governance_violations"
  ],
  [QUERY_TYPES.DEPENDENCY_RISK]: ["dependency_risk", "repo_drift", "knowledge_relationships"],
  [QUERY_TYPES.INCIDENT_ANALYSIS]: ["reliability_incidents", "reliability_trends", "reliability_playbooks", "knowledge_graph"],
  [QUERY_TYPES.PLAYBOOK_LOOKUP]: ["reliability_playbooks", "reliability_recovery_advice", "assistance_workflows"],
  [QUERY_TYPES.WORKFLOW_SUGGESTION]: ["assistance_workflows", "assistance_insights", "reliability_recovery_advice"],
  [QUERY_TYPES.GRAPH_RELATIONSHIP]: ["knowledge_graph", "knowledge_relationships", "knowledge_nodes"],
  [QUERY_TYPES.GENERAL]: [
    "system",
    "health",
    "governance",
    "governance_violations",
    "governance_compliance",
    "intelligence_insights",
    "assistance_insights",
    "reliability_trends",
    "knowledge_graph"
  ]
};

export function getDataSourcesForQueryType(queryType) {
  return SOURCE_MAP[queryType] || SOURCE_MAP[QUERY_TYPES.GENERAL];
}

export function getCopilotSuggestions() {
  return [
    "What services are currently unstable?",
    "Which repositories show governance drift?",
    "Show incidents affecting payment services.",
    "What actions do you recommend for the top current risks?",
    "Which workflows should I run next?"
  ];
}

export function getQueryTypes() {
  return QUERY_TYPES;
}
