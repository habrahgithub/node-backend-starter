import fs from "fs";
import path from "path";
import { env } from "../config/env.js";
import { listFabricNodes, getFabricNodeRecord, verifyFabricNodeToken } from "./nodeRegistry.js";
import { refreshFabricNodeSignals } from "./nodeHeartbeatMonitor.js";

const MAX_SNAPSHOTS = 2000;
const REDACTED_VALUE = "[REDACTED]";
const SENSITIVE_KEYS = ["token", "secret", "password", "private", "key"];

function nowIso() {
  return new Date().toISOString();
}

function safeReadStore() {
  const filePath = env.fabricTelemetryStorePath;
  if (!fs.existsSync(filePath)) {
    return { snapshots: [] };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      snapshots: Array.isArray(parsed?.snapshots) ? parsed.snapshots : []
    };
  } catch {
    return { snapshots: [] };
  }
}

function safeWriteStore(store) {
  const filePath = env.fabricTelemetryStorePath;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf8");
}

function isSensitiveKey(key) {
  const normalized = String(key || "").toLowerCase();
  return SENSITIVE_KEYS.some((hint) => normalized.includes(hint));
}

function sanitizeTelemetryValue(value, depth = 0) {
  if (depth > 5) {
    return "[truncated]";
  }

  if (Array.isArray(value)) {
    return value.slice(0, 150).map((item) => sanitizeTelemetryValue(item, depth + 1));
  }

  if (value && typeof value === "object") {
    const output = {};
    for (const [key, entry] of Object.entries(value).slice(0, 250)) {
      output[key] = isSensitiveKey(key) ? REDACTED_VALUE : sanitizeTelemetryValue(entry, depth + 1);
    }
    return output;
  }

  if (typeof value === "string") {
    return value.slice(0, 2000);
  }

  return value;
}

function normalizeServiceRow(row) {
  const name = String(row?.name || row?.service || "unknown").slice(0, 120);
  const status = String(row?.status || "unknown")
    .toLowerCase()
    .slice(0, 32);
  const latency_ms = Number(row?.latency_ms ?? row?.latencyMs ?? 0);
  const warning_count = Number(row?.warning_count ?? row?.warningCount ?? 0);

  return {
    name,
    status,
    latency_ms: Number.isFinite(latency_ms) ? latency_ms : 0,
    warning_count: Number.isFinite(warning_count) ? warning_count : 0
  };
}

function normalizeTelemetryPayload(payload) {
  const services = Array.isArray(payload?.services) ? payload.services.slice(0, 250).map(normalizeServiceRow) : [];

  const repositories = Array.isArray(payload?.repositories)
    ? payload.repositories.slice(0, 250).map((item) => ({
        name: String(item?.name || "unknown").slice(0, 160),
        status: String(item?.status || "unknown").toLowerCase().slice(0, 32)
      }))
    : [];

  const agents = Array.isArray(payload?.agents)
    ? payload.agents.slice(0, 250).map((item) => ({
        name: String(item?.name || item?.id || "unknown").slice(0, 120),
        status: String(item?.status || "unknown").toLowerCase().slice(0, 32)
      }))
    : [];

  const warnings = Array.isArray(payload?.warnings)
    ? payload.warnings.slice(0, 80).map((item) => String(item || "").slice(0, 240)).filter(Boolean)
    : [];

  const metrics = sanitizeTelemetryValue(payload?.metrics || {}, 0);

  return {
    services,
    repositories,
    agents,
    warnings,
    metrics
  };
}

function latestSnapshotByNode(snapshots) {
  const map = new Map();

  for (const snapshot of snapshots) {
    const existing = map.get(snapshot.node_id);
    if (!existing || Date.parse(snapshot.captured_at) > Date.parse(existing.captured_at)) {
      map.set(snapshot.node_id, snapshot);
    }
  }

  return map;
}

export function ingestFabricNodeTelemetry({ nodeId, token, telemetry }) {
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

  const store = safeReadStore();
  const snapshot = {
    id: `telemetry-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    node_id: node.node_id,
    captured_at: nowIso(),
    telemetry: normalizeTelemetryPayload(telemetry || {})
  };

  store.snapshots = [snapshot, ...store.snapshots].slice(0, MAX_SNAPSHOTS);
  safeWriteStore(store);

  return {
    ok: true,
    snapshot: {
      id: snapshot.id,
      node_id: snapshot.node_id,
      captured_at: snapshot.captured_at,
      services: snapshot.telemetry.services.length,
      repositories: snapshot.telemetry.repositories.length,
      agents: snapshot.telemetry.agents.length,
      warnings: snapshot.telemetry.warnings.length
    }
  };
}

export function getFabricTelemetry() {
  refreshFabricNodeSignals();

  const nodePayload = listFabricNodes();
  const snapshots = safeReadStore().snapshots;
  const latestByNode = latestSnapshotByNode(snapshots);

  const items = nodePayload.items.map((node) => {
    const latest = latestByNode.get(node.node_id) || null;
    const services = latest?.telemetry?.services || [];

    return {
      node_id: node.node_id,
      node_type: node.node_type,
      hostname: node.hostname,
      status: node.status,
      last_seen: node.last_seen,
      telemetry_at: latest?.captured_at || null,
      services_total: services.length,
      services_degraded: services.filter((service) => service.status !== "operational" && service.status !== "online").length,
      repositories_total: latest?.telemetry?.repositories?.length || 0,
      agents_total: latest?.telemetry?.agents?.length || 0,
      warning_count: latest?.telemetry?.warnings?.length || 0,
      metrics: latest?.telemetry?.metrics || {}
    };
  });

  const allServices = [];
  for (const snapshot of latestByNode.values()) {
    for (const service of snapshot.telemetry?.services || []) {
      allServices.push(service);
    }
  }

  return {
    generatedAt: nowIso(),
    mode: "federated_read_only",
    items,
    summary: {
      nodes_total: nodePayload.summary.total,
      nodes_online: nodePayload.summary.online,
      nodes_degraded: nodePayload.summary.degraded,
      nodes_offline: nodePayload.summary.offline,
      nodes_reporting: items.filter((item) => item.telemetry_at).length,
      services_total: allServices.length,
      services_operational: allServices.filter((service) => service.status === "operational" || service.status === "online").length,
      services_degraded: allServices.filter((service) => service.status !== "operational" && service.status !== "online").length
    }
  };
}
