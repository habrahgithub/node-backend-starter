import { env } from "../config/env.js";
import {
  getFabricNodeRecord,
  listFabricNodeRecords,
  updateFabricNodeRecord,
  verifyFabricNodeToken
} from "./nodeRegistry.js";

function toEpochMs(iso) {
  const value = Date.parse(String(iso || ""));
  return Number.isFinite(value) ? value : 0;
}

function nowIso() {
  return new Date().toISOString();
}

function heartbeatThresholds() {
  const degraded = Math.max(15, Number(env.fabricHeartbeatDegradedSeconds || 60));
  const offline = Math.max(degraded + 10, Number(env.fabricHeartbeatOfflineSeconds || 180));
  return {
    degraded,
    offline
  };
}

export function resolveNodeSignal(lastSeenIso, nowMs = Date.now()) {
  const { degraded, offline } = heartbeatThresholds();
  const lastSeenMs = toEpochMs(lastSeenIso);

  if (!lastSeenMs) {
    return "offline";
  }

  const ageSeconds = Math.max(0, Math.floor((nowMs - lastSeenMs) / 1000));
  if (ageSeconds <= degraded) {
    return "online";
  }

  if (ageSeconds <= offline) {
    return "degraded";
  }

  return "offline";
}

export function refreshFabricNodeSignals() {
  const nowMs = Date.now();
  const transitions = [];

  for (const node of listFabricNodeRecords()) {
    const nextSignal = resolveNodeSignal(node.last_seen, nowMs);
    const previousSignal = String(node.status_signal || "offline");

    if (nextSignal === previousSignal) {
      continue;
    }

    updateFabricNodeRecord(node.node_id, {
      status_signal: nextSignal,
      updated_at: nowIso()
    });

    transitions.push({
      node_id: node.node_id,
      from: previousSignal,
      to: nextSignal,
      changed_at: nowIso()
    });
  }

  return transitions;
}

export function recordFabricNodeHeartbeat({ nodeId, token }) {
  const node = getFabricNodeRecord(nodeId);
  if (!node) {
    return {
      ok: false,
      status: "not_found",
      message: "Node is not registered."
    };
  }

  if (!verifyFabricNodeToken(node, token)) {
    return {
      ok: false,
      status: "unauthorized",
      message: "Node token is invalid."
    };
  }

  const updated = updateFabricNodeRecord(node.node_id, {
    last_seen: nowIso(),
    status_signal: "online"
  });

  return {
    ok: true,
    node_id: updated.node_id,
    status: updated.status_signal,
    last_seen: updated.last_seen
  };
}
