import {
  getAgentStateAdapter,
  getServiceHeartbeatAdapter,
  refreshArtifactSignals,
  refreshRepoInventory
} from "../services/integrationAdapters.js";

export function refreshRepoInventoryController(_req, res) {
  try {
    res.json(refreshRepoInventory());
  } catch (error) {
    res.status(503).json({
      error: "repo_inventory_refresh_unavailable",
      message: "Repository inventory refresh failed.",
      details: error.message
    });
  }
}

export function refreshArtifactSignalsController(_req, res) {
  try {
    res.json(refreshArtifactSignals());
  } catch (error) {
    res.status(503).json({
      error: "artifact_refresh_unavailable",
      message: "Artifact signal refresh failed.",
      details: error.message
    });
  }
}

export async function getAgentStateAdapterController(_req, res) {
  try {
    res.json(await getAgentStateAdapter());
  } catch (error) {
    res.status(503).json({
      error: "agent_state_adapter_unavailable",
      message: "Agent state adapter failed.",
      details: error.message
    });
  }
}

export async function getServiceHeartbeatAdapterController(_req, res) {
  try {
    res.json(await getServiceHeartbeatAdapter());
  } catch (error) {
    res.status(503).json({
      error: "service_heartbeat_adapter_unavailable",
      message: "Service heartbeat adapter failed.",
      details: error.message
    });
  }
}
