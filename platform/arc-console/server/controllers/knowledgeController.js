import { buildKnowledgeGraph } from "../knowledge/graphBuilder.js";
import { queryKnowledgeByRepository, queryKnowledgeByService } from "../knowledge/graphQueryEngine.js";
import { getGraphSnapshots } from "../knowledge/graphSnapshotStore.js";
import { getKnowledgeNodes } from "../knowledge/nodeRegistry.js";
import { mapKnowledgeRelationships } from "../knowledge/relationshipMapper.js";
import { recordKnowledgeEvent } from "../services/observability.js";

export function getKnowledgeNodesController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = getKnowledgeNodes({ forceRefresh });
    res.json(payload);
  } catch (error) {
    res.status(503).json({
      error: "knowledge_nodes_unavailable",
      message: "Knowledge graph nodes are unavailable.",
      details: error.message
    });
  }
}

export function getKnowledgeRelationshipsController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = mapKnowledgeRelationships({ forceRefresh });
    res.json(payload);
  } catch (error) {
    res.status(503).json({
      error: "knowledge_relationships_unavailable",
      message: "Knowledge graph relationships are unavailable.",
      details: error.message
    });
  }
}

export function getKnowledgeGraphController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = buildKnowledgeGraph({ forceRefresh });

    recordKnowledgeEvent({
      eventType: "KNOWLEDGE_GRAPH_BUILT",
      severity: payload.metadata?.missing_reference_count > 0 ? "medium" : "info",
      title: "knowledge graph built",
      message: `nodes=${payload.metadata?.node_count || 0}, relationships=${payload.metadata?.relationship_count || 0}`,
      domain: "graph",
      confidenceScore: 0.88,
      evidence: [
        `nodes=${payload.metadata?.node_count || 0}`,
        `relationships=${payload.metadata?.relationship_count || 0}`,
        `missing=${payload.metadata?.missing_reference_count || 0}`
      ]
    });

    res.json(payload);
  } catch (error) {
    res.status(503).json({
      error: "knowledge_graph_unavailable",
      message: "Knowledge graph build is unavailable.",
      details: error.message
    });
  }
}

export function queryKnowledgeServiceController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const name = String(req.params.name || "").trim();

    if (!name) {
      return res.status(400).json({
        error: "invalid_request",
        message: "service name is required."
      });
    }

    const payload = queryKnowledgeByService(name, { forceRefresh });

    recordKnowledgeEvent({
      eventType: "KNOWLEDGE_GRAPH_QUERY",
      severity: payload.found ? "info" : "medium",
      title: `service query: ${name}`,
      message: payload.found ? "service query resolved" : "service query not found",
      domain: "query.service",
      confidenceScore: payload.found ? 0.84 : 0.65,
      evidence: [
        `found=${payload.found}`,
        `dependencies=${payload.metadata?.dependency_count || 0}`,
        `incidents=${payload.metadata?.incident_count || 0}`
      ]
    });

    return res.json(payload);
  } catch (error) {
    return res.status(503).json({
      error: "knowledge_query_service_unavailable",
      message: "Service knowledge query is unavailable.",
      details: error.message
    });
  }
}

export function queryKnowledgeRepositoryController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const name = String(req.params.name || "").trim();

    if (!name) {
      return res.status(400).json({
        error: "invalid_request",
        message: "repository name is required."
      });
    }

    const payload = queryKnowledgeByRepository(name, { forceRefresh });

    recordKnowledgeEvent({
      eventType: "KNOWLEDGE_GRAPH_QUERY",
      severity: payload.found ? "info" : "medium",
      title: `repository query: ${name}`,
      message: payload.found ? "repository query resolved" : "repository query not found",
      domain: "query.repository",
      confidenceScore: payload.found ? 0.84 : 0.65,
      evidence: [
        `found=${payload.found}`,
        `services=${payload.metadata?.service_count || 0}`,
        `incidents=${payload.metadata?.incident_count || 0}`
      ]
    });

    return res.json(payload);
  } catch (error) {
    return res.status(503).json({
      error: "knowledge_query_repository_unavailable",
      message: "Repository knowledge query is unavailable.",
      details: error.message
    });
  }
}

export function getKnowledgeSnapshotsController(req, res) {
  try {
    const forceRefresh = String(req.query.refresh || "false") === "true";
    const payload = getGraphSnapshots({ forceRefresh });

    recordKnowledgeEvent({
      eventType: "KNOWLEDGE_GRAPH_SNAPSHOT",
      severity: "info",
      title: "knowledge graph snapshot captured",
      message: `snapshots=${payload.items?.length || 0}`,
      domain: "snapshots",
      confidenceScore: 0.86,
      evidence: [
        `snapshot_id=${payload.latest?.snapshot_id || "none"}`,
        `node_count=${payload.latest?.node_count || 0}`,
        `relationship_count=${payload.latest?.relationship_count || 0}`
      ]
    });

    res.json(payload);
  } catch (error) {
    res.status(503).json({
      error: "knowledge_snapshots_unavailable",
      message: "Knowledge graph snapshots are unavailable.",
      details: error.message
    });
  }
}
