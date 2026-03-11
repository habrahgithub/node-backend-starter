import crypto from "crypto";
import fs from "fs";
import path from "path";
import { env } from "../config/env.js";

const MAX_CAPABILITIES = 24;

function normalizeNodeId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._:-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function normalizeNodeType(value) {
  return String(value || "unknown")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._:-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeHostname(value) {
  return String(value || "unknown")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .slice(0, 180);
}

function normalizeCapabilities(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set();
  const items = [];

  for (const entry of value) {
    const capability = String(entry || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9._:-]+/g, "")
      .slice(0, 80);

    if (!capability || seen.has(capability)) {
      continue;
    }

    seen.add(capability);
    items.push(capability);

    if (items.length >= MAX_CAPABILITIES) {
      break;
    }
  }

  return items;
}

function nowIso() {
  return new Date().toISOString();
}

function safeReadStore() {
  const filePath = env.fabricNodeRegistryPath;
  if (!fs.existsSync(filePath)) {
    return { nodes: [] };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const nodes = Array.isArray(parsed?.nodes) ? parsed.nodes : [];
    return { nodes };
  } catch {
    return { nodes: [] };
  }
}

function safeWriteStore(store) {
  const filePath = env.fabricNodeRegistryPath;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf8");
}

export function hashFabricToken(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function toPublicNode(record) {
  return {
    node_id: record.node_id,
    node_type: record.node_type,
    hostname: record.hostname,
    capabilities: record.capabilities || [],
    status: record.status_signal || "offline",
    last_seen: record.last_seen || null,
    registered_at: record.registered_at || null,
    updated_at: record.updated_at || null
  };
}

export function listFabricNodeRecords() {
  return safeReadStore().nodes;
}

export function getFabricNodeRecord(nodeId) {
  const normalized = normalizeNodeId(nodeId);
  return listFabricNodeRecords().find((item) => item.node_id === normalized) || null;
}

export function updateFabricNodeRecord(nodeId, patch = {}) {
  const normalized = normalizeNodeId(nodeId);
  const store = safeReadStore();
  const index = store.nodes.findIndex((item) => item.node_id === normalized);

  if (index === -1) {
    return null;
  }

  const current = store.nodes[index];
  const next = {
    ...current,
    ...patch,
    node_id: current.node_id,
    node_type: normalizeNodeType(patch.node_type || current.node_type),
    hostname: normalizeHostname(patch.hostname || current.hostname),
    capabilities: normalizeCapabilities(patch.capabilities || current.capabilities),
    updated_at: nowIso()
  };

  store.nodes[index] = next;
  safeWriteStore(store);
  return next;
}

export function verifyFabricNodeToken(nodeRecord, token) {
  if (!nodeRecord || !nodeRecord.auth_hash) {
    return false;
  }
  return hashFabricToken(token) === nodeRecord.auth_hash;
}

export function validateFabricNodeRegistrationPayload(payload) {
  const node_id = normalizeNodeId(payload?.node_id);
  const node_type = normalizeNodeType(payload?.node_type);
  const hostname = normalizeHostname(payload?.hostname);
  const capabilities = normalizeCapabilities(payload?.capabilities);
  const token = String(payload?.token || "");

  const errors = [];
  if (!node_id) {
    errors.push("node_id is required");
  }
  if (!node_type || node_type === "unknown") {
    errors.push("node_type is required");
  }
  if (!hostname || hostname === "unknown") {
    errors.push("hostname is required");
  }
  if (!token) {
    errors.push("token is required");
  }

  return {
    valid: errors.length === 0,
    errors,
    normalized: {
      node_id,
      node_type,
      hostname,
      capabilities,
      token
    }
  };
}

export function registerFabricNode(payload, { operator = "operator" } = {}) {
  const check = validateFabricNodeRegistrationPayload(payload);
  if (!check.valid) {
    return {
      ok: false,
      status: "invalid",
      errors: check.errors
    };
  }

  if (check.normalized.token !== env.fabricNodeRegistrationToken) {
    return {
      ok: false,
      status: "unauthorized",
      errors: ["registration token is invalid"]
    };
  }

  const store = safeReadStore();
  const exists = store.nodes.some((item) => item.node_id === check.normalized.node_id);
  if (exists) {
    return {
      ok: false,
      status: "duplicate",
      errors: ["node_id already registered"]
    };
  }

  const record = {
    node_id: check.normalized.node_id,
    node_type: check.normalized.node_type,
    hostname: check.normalized.hostname,
    capabilities: check.normalized.capabilities,
    status_signal: "online",
    last_seen: nowIso(),
    registered_at: nowIso(),
    updated_at: nowIso(),
    registered_by: String(operator || "operator").slice(0, 80),
    auth_hash: hashFabricToken(check.normalized.token)
  };

  store.nodes.push(record);
  safeWriteStore(store);

  return {
    ok: true,
    node: toPublicNode(record)
  };
}

export function listFabricNodes() {
  const items = listFabricNodeRecords().map((item) => toPublicNode(item));

  return {
    generatedAt: nowIso(),
    mode: "fabric_metadata_local",
    items,
    summary: {
      total: items.length,
      online: items.filter((item) => item.status === "online").length,
      degraded: items.filter((item) => item.status === "degraded").length,
      offline: items.filter((item) => item.status === "offline").length
    }
  };
}

export function getFabricNodeById(nodeId) {
  const record = getFabricNodeRecord(nodeId);
  if (!record) {
    return null;
  }

  return {
    generatedAt: nowIso(),
    mode: "fabric_metadata_local",
    item: toPublicNode(record)
  };
}
