import { buildKnowledgeGraph } from "./graphBuilder.js";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function includesName(candidate, query) {
  return normalize(candidate).includes(normalize(query));
}

function findNode(graph, type, name) {
  const query = normalize(name);

  return (graph.nodes || []).find((node) => {
    if (node.node_type !== type) {
      return false;
    }

    const attrs = node.attributes || {};
    return (
      includesName(node.node_id, query) ||
      includesName(attrs.name, query) ||
      includesName(attrs.id, query) ||
      includesName(attrs.relativePath, query)
    );
  });
}

function outbound(graph, sourceId, relationship) {
  return (graph.relationships || []).filter((edge) => edge.source === sourceId && edge.relationship === relationship);
}

function inbound(graph, targetId, relationship) {
  return (graph.relationships || []).filter((edge) => edge.target === targetId && edge.relationship === relationship);
}

function nodeById(graph, id) {
  return (graph.nodes || []).find((node) => node.node_id === id) || null;
}

export function queryKnowledgeByService(name, { forceRefresh = false } = {}) {
  const graph = buildKnowledgeGraph({ forceRefresh });
  const serviceNode = findNode(graph, "service", name);

  if (!serviceNode) {
    return {
      generatedAt: new Date().toISOString(),
      found: false,
      message: "Service not found in knowledge graph.",
      query: name,
      dependencies: [],
      incidents: [],
      workflows: [],
      repository: null
    };
  }

  const dependencyEdges = outbound(graph, serviceNode.node_id, "depends_on");
  const repositoryEdge = outbound(graph, serviceNode.node_id, "hosted_in")[0] || null;
  const incidentEdges = inbound(graph, serviceNode.node_id, "affects");
  const workflowEdges = inbound(graph, serviceNode.node_id, "targets");

  return {
    generatedAt: new Date().toISOString(),
    found: true,
    query: name,
    service: serviceNode,
    repository: repositoryEdge ? nodeById(graph, repositoryEdge.target) : null,
    dependencies: dependencyEdges.map((edge) => nodeById(graph, edge.target)).filter(Boolean),
    incidents: incidentEdges.map((edge) => nodeById(graph, edge.source)).filter(Boolean),
    workflows: workflowEdges.map((edge) => nodeById(graph, edge.source)).filter(Boolean),
    metadata: {
      dependency_count: dependencyEdges.length,
      incident_count: incidentEdges.length,
      workflow_count: workflowEdges.length
    }
  };
}

export function queryKnowledgeByRepository(name, { forceRefresh = false } = {}) {
  const graph = buildKnowledgeGraph({ forceRefresh });
  const repositoryNode = findNode(graph, "repository", name);

  if (!repositoryNode) {
    return {
      generatedAt: new Date().toISOString(),
      found: false,
      message: "Repository not found in knowledge graph.",
      query: name,
      services: [],
      incidents: [],
      workflows: []
    };
  }

  const hostedEdges = inbound(graph, repositoryNode.node_id, "hosted_in");
  const services = hostedEdges.map((edge) => nodeById(graph, edge.source)).filter(Boolean);

  const serviceIds = new Set(services.map((service) => service.node_id));

  const incidentEdges = (graph.relationships || []).filter(
    (edge) => edge.relationship === "affects" && serviceIds.has(edge.target)
  );
  const workflowEdges = (graph.relationships || []).filter(
    (edge) => edge.relationship === "targets" && serviceIds.has(edge.target)
  );

  return {
    generatedAt: new Date().toISOString(),
    found: true,
    query: name,
    repository: repositoryNode,
    services,
    incidents: incidentEdges.map((edge) => nodeById(graph, edge.source)).filter(Boolean),
    workflows: workflowEdges.map((edge) => nodeById(graph, edge.source)).filter(Boolean),
    metadata: {
      service_count: services.length,
      incident_count: incidentEdges.length,
      workflow_count: workflowEdges.length
    }
  };
}
