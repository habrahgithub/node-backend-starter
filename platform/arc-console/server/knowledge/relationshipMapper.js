import { analyzeServiceTrends } from "../intelligence/serviceTrendAnalyzer.js";
import { getWorkflowGuidance } from "../assistance/workflowAdvisor.js";
import { buildNodeRegistryFromSources, collectKnowledgeSources } from "./nodeRegistry.js";

function slug(value) {
  return String(value || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function mapRepositoryNodeId(repository) {
  return `repository:${slug(repository.relativePath || repository.name)}`;
}

function mapServiceNodeId(service) {
  return `service:${slug(service.id || service.name)}`;
}

function mapDependencyNodeId(dependency) {
  return `dependency:${slug(dependency.repository)}:${slug(dependency.package)}`;
}

function mapAgentNodeId(agent) {
  return `agent:${slug(agent.id || agent.name)}`;
}

function mapWorkflowNodeId(workflow) {
  return `workflow:${slug(workflow.id)}`;
}

function mapIncidentNodeId(incident) {
  return `incident:${slug(incident.incident_id)}`;
}

function mapPlaybookNodeId(playbook) {
  return `playbook:${slug(playbook.incident_id)}`;
}

function pushEdge(items, source, relationship, target, confidence, evidence = []) {
  items.push({
    source,
    relationship,
    target,
    confidence: Number(Number(confidence || 0.6).toFixed(2)),
    evidence
  });
}

function bestRepositoryForService(service, repositories) {
  const servicePath = String(service.path || "");
  if (!servicePath) {
    return null;
  }

  const exact = repositories.find((repo) => repo.relativePath === servicePath || repo.path === servicePath);
  if (exact) {
    return { repository: exact, confidence: 0.92, evidence: ["path_exact_match"] };
  }

  const byPrefix = repositories
    .filter((repo) => servicePath.startsWith(String(repo.relativePath || "")) && String(repo.relativePath || "") !== "")
    .sort((a, b) => String(b.relativePath || "").length - String(a.relativePath || "").length)[0];

  if (byPrefix) {
    return { repository: byPrefix, confidence: 0.84, evidence: ["path_prefix_match"] };
  }

  const byName = repositories.find((repo) => {
    const repoName = String(repo.name || "").toLowerCase();
    const serviceName = String(service.name || service.id || "").toLowerCase();
    return repoName && serviceName && (serviceName.includes(repoName) || repoName.includes(serviceName));
  });

  if (byName) {
    return { repository: byName, confidence: 0.66, evidence: ["name_similarity_match"] };
  }

  return null;
}

export function mapKnowledgeRelationships({ forceRefresh = false } = {}) {
  const sources = collectKnowledgeSources({ forceRefresh });
  const nodes = buildNodeRegistryFromSources(sources);
  const nodeIds = new Set(nodes.map((node) => node.node_id));
  const edges = [];

  const repoByName = new Map((sources.repositories || []).map((repo) => [repo.name, repo]));
  const dependencyByRepo = new Map();
  for (const dependency of sources.dependencies || []) {
    const existing = dependencyByRepo.get(dependency.repository) || [];
    existing.push(dependency);
    dependencyByRepo.set(dependency.repository, existing);
  }

  for (const service of sources.services || []) {
    const serviceNode = mapServiceNodeId(service);
    const repoMatch = bestRepositoryForService(service, sources.repositories || []);

    if (repoMatch) {
      pushEdge(
        edges,
        serviceNode,
        "hosted_in",
        mapRepositoryNodeId(repoMatch.repository),
        repoMatch.confidence,
        repoMatch.evidence
      );

      const repoDependencies = dependencyByRepo.get(repoMatch.repository.name) || [];
      for (const dependency of repoDependencies.slice(0, 40)) {
        pushEdge(
          edges,
          serviceNode,
          "depends_on",
          mapDependencyNodeId(dependency),
          dependency.risk_level === "high" ? 0.85 : 0.72,
          [`dependency_risk=${dependency.risk_level}`]
        );
      }
    }
  }

  for (const incident of sources.incidents || []) {
    const service = (sources.services || []).find((item) => item.name === incident.service || item.id === incident.service_id);
    if (service) {
      pushEdge(
        edges,
        mapIncidentNodeId(incident),
        "affects",
        mapServiceNodeId(service),
        incident.confidence || 0.7,
        incident.evidence || []
      );
    }
  }

  for (const playbook of sources.playbooks || []) {
    pushEdge(
      edges,
      mapPlaybookNodeId(playbook),
      "resolves",
      `incident:${slug(playbook.incident_id)}`,
      playbook.confidence || 0.75,
      playbook.evidence || []
    );
  }

  const workflowById = new Map((sources.workflows || []).map((workflow) => [workflow.id, workflow]));
  const serviceByName = new Map((sources.services || []).map((service) => [service.name, service]));

  const workflowGuidance = getWorkflowGuidance({ forceRefresh }).items || [];
  for (const hint of workflowGuidance) {
    const workflow = workflowById.get(hint.workflow);
    if (!workflow) {
      continue;
    }

    const triggerName = String(hint.trigger_risk || "").split(" (")[0];
    const service = serviceByName.get(triggerName);

    if (service) {
      pushEdge(
        edges,
        mapWorkflowNodeId(workflow),
        "targets",
        mapServiceNodeId(service),
        Number(hint.confidence || 0.65),
        hint.evidence || []
      );
    }
  }

  const serviceTrends = analyzeServiceTrends({ forceRefresh }).items || [];
  const unstableServices = serviceTrends
    .filter((service) => service.health_trend !== "stable" || service.stability_score < 75)
    .map((service) => (sources.services || []).find((item) => item.id === service.service_id || item.name === service.service))
    .filter(Boolean);

  for (const workflow of sources.workflows || []) {
    if (workflow.id === "agent-health-check") {
      for (const service of unstableServices.slice(0, 10)) {
        pushEdge(edges, mapWorkflowNodeId(workflow), "targets", mapServiceNodeId(service), 0.55, ["unstable_service_target"]);
      }
    }

    if (workflow.id === "system-scan" || workflow.id === "platform-health-check") {
      for (const service of (sources.services || []).slice(0, 30)) {
        pushEdge(edges, mapWorkflowNodeId(workflow), "targets", mapServiceNodeId(service), 0.6, ["broad_scan_target"]);
      }
    }
  }

  for (const agent of sources.agents || []) {
    const role = String(agent.role || "").toLowerCase();

    for (const workflow of sources.workflows || []) {
      let confidence = 0;

      if (role.includes("execution") && ["system-scan", "repo-audit", "platform-health-check", "agent-health-check"].includes(workflow.id)) {
        confidence = 0.62;
      } else if (role.includes("governance") && ["repo-audit", "system-scan"].includes(workflow.id)) {
        confidence = 0.57;
      } else if (role.includes("security") && workflow.id === "platform-health-check") {
        confidence = 0.54;
      } else if (role.includes("audit") && workflow.id === "repo-audit") {
        confidence = 0.53;
      } else if (role.includes("assistant") && workflow.id === "agent-health-check") {
        confidence = 0.5;
      }

      if (confidence > 0) {
        pushEdge(edges, mapAgentNodeId(agent), "executes", mapWorkflowNodeId(workflow), confidence, [`role=${agent.role}`]);
      }
    }
  }

  const validEdges = edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));

  return {
    generatedAt: new Date().toISOString(),
    mode: "derived_read_only",
    items: validEdges,
    summary: {
      total: validEdges.length,
      hosted_in: validEdges.filter((edge) => edge.relationship === "hosted_in").length,
      depends_on: validEdges.filter((edge) => edge.relationship === "depends_on").length,
      affects: validEdges.filter((edge) => edge.relationship === "affects").length,
      resolves: validEdges.filter((edge) => edge.relationship === "resolves").length,
      executes: validEdges.filter((edge) => edge.relationship === "executes").length,
      targets: validEdges.filter((edge) => edge.relationship === "targets").length
    }
  };
}
