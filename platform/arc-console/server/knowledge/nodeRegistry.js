import { getWorkflows } from "../automation/operatorWorkflow.js";
import { analyzeDependencyRisk } from "../intelligence/dependencyRiskAnalyzer.js";
import { getRemediationPlaybooks } from "../reliability/remediationPlaybookEngine.js";
import { getServiceRecoveryAdvice } from "../reliability/serviceRecoveryAdvisor.js";
import { detectIncidentPatterns } from "../reliability/incidentPatternDetector.js";
import { listAgentState } from "../automation/agentOrchestrator.js";
import { getRepositories, getServices } from "../services/systemRegistry.js";

function slug(value) {
  return String(value || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function pushNode(items, node_type, node_id, attributes) {
  items.push({
    node_id,
    node_type,
    attributes
  });
}

export function collectKnowledgeSources({ forceRefresh = false } = {}) {
  return {
    services: getServices({ forceRefresh }) || [],
    repositories: getRepositories({ forceRefresh }) || [],
    dependencies: (analyzeDependencyRisk({ forceRefresh }).items || []).slice(0, 400),
    agents: listAgentState({ forceRefresh }).items || [],
    workflows: getWorkflows({ forceRefresh }).items || [],
    incidents: detectIncidentPatterns({ forceRefresh }).items || [],
    playbooks: getRemediationPlaybooks({ forceRefresh }).items || [],
    recovery: getServiceRecoveryAdvice({ forceRefresh }).items || []
  };
}

export function buildNodeRegistryFromSources(sources) {
  const items = [];

  for (const service of sources.services || []) {
    pushNode(items, "service", `service:${slug(service.id || service.name)}`, {
      id: service.id,
      name: service.name,
      status: service.status,
      runtime: service.runtime,
      path: service.path || "",
      domain: service.domain || "unknown"
    });
  }

  for (const repository of sources.repositories || []) {
    pushNode(items, "repository", `repository:${slug(repository.relativePath || repository.name)}`, {
      id: repository.id,
      name: repository.name,
      relativePath: repository.relativePath || "",
      status: repository.status,
      repoType: repository.repoType
    });
  }

  for (const dependency of sources.dependencies || []) {
    pushNode(items, "dependency", `dependency:${slug(dependency.repository)}:${slug(dependency.package)}`, {
      package: dependency.package,
      repository: dependency.repository,
      current_version: dependency.current_version,
      risk_score: dependency.risk_score,
      risk_level: dependency.risk_level
    });
  }

  for (const agent of sources.agents || []) {
    pushNode(items, "agent", `agent:${slug(agent.id || agent.name)}`, {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      status: agent.status,
      pipelineStage: agent.pipelineStage
    });
  }

  for (const workflow of sources.workflows || []) {
    pushNode(items, "workflow", `workflow:${slug(workflow.id)}`, {
      id: workflow.id,
      title: workflow.title,
      description: workflow.description,
      prerequisites: workflow.prerequisites || []
    });
  }

  for (const incident of sources.incidents || []) {
    pushNode(items, "incident", `incident:${slug(incident.incident_id)}`, {
      incident_id: incident.incident_id,
      service: incident.service,
      pattern_type: incident.pattern_type,
      severity: incident.severity,
      occurrence_count: incident.occurrence_count
    });
  }

  for (const playbook of sources.playbooks || []) {
    pushNode(items, "playbook", `playbook:${slug(playbook.incident_id)}`, {
      incident_id: playbook.incident_id,
      service: playbook.service,
      playbook_title: playbook.playbook_title,
      approval_required: playbook.approval_required,
      confidence: playbook.confidence
    });
  }

  for (const recovery of sources.recovery || []) {
    pushNode(items, "recovery", `recovery:${slug(recovery.service)}`, {
      service: recovery.service,
      action_mode: recovery.action_mode,
      approval_required: recovery.approval_required,
      confidence: recovery.confidence,
      linked_playbook: recovery.linked_playbook
    });
  }

  return items;
}

export function getKnowledgeNodes({ forceRefresh = false } = {}) {
  const sources = collectKnowledgeSources({ forceRefresh });
  const items = buildNodeRegistryFromSources(sources);

  return {
    generatedAt: new Date().toISOString(),
    mode: "derived_read_only",
    items,
    summary: {
      total: items.length,
      by_type: {
        service: items.filter((item) => item.node_type === "service").length,
        repository: items.filter((item) => item.node_type === "repository").length,
        dependency: items.filter((item) => item.node_type === "dependency").length,
        agent: items.filter((item) => item.node_type === "agent").length,
        workflow: items.filter((item) => item.node_type === "workflow").length,
        incident: items.filter((item) => item.node_type === "incident").length,
        playbook: items.filter((item) => item.node_type === "playbook").length,
        recovery: items.filter((item) => item.node_type === "recovery").length
      }
    }
  };
}
