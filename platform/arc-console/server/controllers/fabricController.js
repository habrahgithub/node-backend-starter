import { getFabricTopologyMap } from "../fabric/fabricTopologyMap.js";
import { refreshFabricNodeSignals, recordFabricNodeHeartbeat } from "../fabric/nodeHeartbeatMonitor.js";
import { routeFabricQuery } from "../fabric/nodeQueryRouter.js";
import { getFabricNodeById, listFabricNodes, registerFabricNode } from "../fabric/nodeRegistry.js";
import { getFabricTelemetry, ingestFabricNodeTelemetry } from "../fabric/nodeTelemetryAggregator.js";
import { recordFabricEvent } from "../services/observability.js";

function nodeTokenFromRequest(req) {
  return (
    String(req.body?.token || "").trim() ||
    String(req.headers["x-fabric-node-token"] || "").trim() ||
    String(req.query.token || "").trim()
  );
}

function emitOfflineTransitions(transitions) {
  for (const transition of transitions.filter((item) => item.to === "offline")) {
    recordFabricEvent({
      eventType: "FABRIC_NODE_OFFLINE",
      severity: "high",
      title: `${transition.node_id} offline`,
      message: `Node ${transition.node_id} moved from ${transition.from} to offline.`,
      domain: transition.node_id,
      confidenceScore: 0.9,
      evidence: [`from=${transition.from}`, `to=${transition.to}`]
    });
  }
}

export function registerFabricNodeController(req, res) {
  try {
    const result = registerFabricNode(req.body || {}, {
      operator: req.arcSession?.username || "operator"
    });

    if (!result.ok) {
      if (result.status === "unauthorized") {
        return res.status(403).json({
          error: "fabric_node_registration_unauthorized",
          message: "Node registration token is invalid.",
          issues: result.errors
        });
      }

      if (result.status === "duplicate") {
        return res.status(409).json({
          error: "fabric_node_duplicate",
          message: "Node is already registered.",
          issues: result.errors
        });
      }

      return res.status(400).json({
        error: "fabric_node_registration_invalid",
        message: "Node registration payload is invalid.",
        issues: result.errors
      });
    }

    recordFabricEvent({
      eventType: "FABRIC_NODE_REGISTERED",
      severity: "info",
      title: result.node.node_id,
      message: `Registered node ${result.node.hostname}.`,
      domain: result.node.node_type,
      confidenceScore: 0.95,
      evidence: result.node.capabilities
    });

    return res.status(201).json({
      node: result.node
    });
  } catch (error) {
    return res.status(503).json({
      error: "fabric_node_registration_unavailable",
      message: "Node registration is unavailable.",
      details: error.message
    });
  }
}

export function listFabricNodesController(_req, res) {
  try {
    const transitions = refreshFabricNodeSignals();
    emitOfflineTransitions(transitions);

    const payload = listFabricNodes();
    return res.json({
      ...payload,
      transitions
    });
  } catch (error) {
    return res.status(503).json({
      error: "fabric_nodes_unavailable",
      message: "Fabric node list is unavailable.",
      details: error.message
    });
  }
}

export function getFabricNodeController(req, res) {
  try {
    refreshFabricNodeSignals();
    const payload = getFabricNodeById(req.params.id);

    if (!payload) {
      return res.status(404).json({
        error: "fabric_node_not_found",
        message: "Requested node is not registered."
      });
    }

    return res.json(payload);
  } catch (error) {
    return res.status(503).json({
      error: "fabric_node_lookup_unavailable",
      message: "Fabric node lookup is unavailable.",
      details: error.message
    });
  }
}

export function recordFabricNodeHeartbeatController(req, res) {
  try {
    const result = recordFabricNodeHeartbeat({
      nodeId: req.params.id,
      token: nodeTokenFromRequest(req)
    });

    if (!result.ok) {
      if (result.status === "not_found") {
        return res.status(404).json({
          error: "fabric_node_not_found",
          message: result.message
        });
      }

      return res.status(403).json({
        error: "fabric_node_heartbeat_unauthorized",
        message: result.message
      });
    }

    recordFabricEvent({
      eventType: "FABRIC_NODE_HEARTBEAT",
      severity: "info",
      title: result.node_id,
      message: `Heartbeat received for ${result.node_id}.`,
      domain: result.node_id,
      confidenceScore: 0.92,
      evidence: [`status=${result.status}`]
    });

    return res.json(result);
  } catch (error) {
    return res.status(503).json({
      error: "fabric_node_heartbeat_unavailable",
      message: "Node heartbeat processing is unavailable.",
      details: error.message
    });
  }
}

export function ingestFabricTelemetryController(req, res) {
  try {
    const token = nodeTokenFromRequest(req);
    const telemetryBody =
      req.body?.telemetry && typeof req.body.telemetry === "object"
        ? req.body.telemetry
        : Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => key !== "token"));

    const result = ingestFabricNodeTelemetry({
      nodeId: req.params.id,
      token,
      telemetry: telemetryBody
    });

    if (!result.ok) {
      if (result.status === "not_found") {
        return res.status(404).json({
          error: "fabric_node_not_found",
          message: result.message
        });
      }

      return res.status(403).json({
        error: "fabric_node_telemetry_unauthorized",
        message: result.message
      });
    }

    return res.status(201).json(result);
  } catch (error) {
    return res.status(503).json({
      error: "fabric_telemetry_ingest_unavailable",
      message: "Fabric telemetry ingest is unavailable.",
      details: error.message
    });
  }
}

export function getFabricTelemetryController(_req, res) {
  try {
    const transitions = refreshFabricNodeSignals();
    emitOfflineTransitions(transitions);

    const payload = getFabricTelemetry();
    return res.json({
      ...payload,
      transitions
    });
  } catch (error) {
    return res.status(503).json({
      error: "fabric_telemetry_unavailable",
      message: "Fabric telemetry is unavailable.",
      details: error.message
    });
  }
}

export function queryFabricController(req, res) {
  try {
    const query = String(req.body?.query || "").trim();
    const nodeId = String(req.body?.node_id || "").trim();

    if (!query) {
      return res.status(400).json({
        error: "invalid_request",
        message: "query is required."
      });
    }

    const payload = routeFabricQuery({ query, nodeId });

    recordFabricEvent({
      eventType: "FABRIC_QUERY_ROUTED",
      severity: "info",
      title: payload.query_type,
      message: query.slice(0, 200),
      domain: payload.target,
      confidenceScore: 0.88,
      evidence: payload.evidence_sources
    });

    return res.json(payload);
  } catch (error) {
    return res.status(503).json({
      error: "fabric_query_unavailable",
      message: "Fabric query routing is unavailable.",
      details: error.message
    });
  }
}

export function getFabricTopologyController(_req, res) {
  try {
    const transitions = refreshFabricNodeSignals();
    emitOfflineTransitions(transitions);

    const payload = getFabricTopologyMap();
    return res.json({
      ...payload,
      transitions
    });
  } catch (error) {
    return res.status(503).json({
      error: "fabric_topology_unavailable",
      message: "Fabric topology map is unavailable.",
      details: error.message
    });
  }
}
