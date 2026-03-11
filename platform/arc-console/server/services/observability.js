import fs from "fs";
import path from "path";
import { env } from "../config/env.js";

const MAX_EVENTS = 1000;
const routeStats = new Map();
const events = [];

function sanitizeLogField(value) {
  return String(value ?? "")
    .replaceAll("\t", " ")
    .replaceAll("\n", " ")
    .replaceAll("\r", " ")
    .trim();
}

function appendOperatorActionLine({ timestamp, operator, action, target, result, durationMs }) {
  const destination = env.operatorActionLogPath;
  const dir = path.dirname(destination);
  fs.mkdirSync(dir, { recursive: true });

  const line = [
    sanitizeLogField(timestamp),
    sanitizeLogField(operator),
    sanitizeLogField(action),
    sanitizeLogField(target),
    sanitizeLogField(result),
    sanitizeLogField(durationMs)
  ].join("\t");

  fs.appendFileSync(destination, `${line}\n`, "utf8");
}

function clampEvents() {
  if (events.length <= MAX_EVENTS) {
    return;
  }
  events.splice(0, events.length - MAX_EVENTS);
}

function pushEvent(event) {
  events.push({
    at: new Date().toISOString(),
    ...event
  });
  clampEvents();
}

function updateRouteMetric(pathname, durationMs, statusCode) {
  const key = String(pathname || "unknown");
  const current = routeStats.get(key) || {
    path: key,
    count: 0,
    totalDurationMs: 0,
    maxDurationMs: 0,
    lastStatusCode: 0,
    lastDurationMs: 0
  };

  current.count += 1;
  current.totalDurationMs += durationMs;
  current.maxDurationMs = Math.max(current.maxDurationMs, durationMs);
  current.lastStatusCode = statusCode;
  current.lastDurationMs = durationMs;

  routeStats.set(key, current);
}

export function recordRequestEvent({ requestId, method, path, statusCode, durationMs, authenticated }) {
  const roundedDuration = Number(durationMs.toFixed(2));
  updateRouteMetric(path, roundedDuration, statusCode);

  pushEvent({
    id: `req-${requestId}`,
    source: "request",
    level: statusCode >= 500 ? "error" : statusCode >= 400 ? "warning" : "info",
    message: `${method} ${path} -> ${statusCode} (${roundedDuration}ms)`,
    requestId,
    method,
    path,
    statusCode,
    durationMs: roundedDuration,
    authenticated: Boolean(authenticated)
  });
}

export function recordErrorEvent({ source, message, requestId, path, details }) {
  pushEvent({
    id: `err-${requestId || Date.now()}`,
    source: source || "server",
    level: "error",
    message,
    requestId,
    path,
    details
  });
}

export function recordWarningEvent({ source, code, message, path }) {
  pushEvent({
    id: `warn-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    source: source || "system",
    level: "warning",
    message,
    code,
    path
  });
}

export function recordAuditEvent({ action, outcome, actor = "operator", ipAddress = "unknown", details = "" }) {
  pushEvent({
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    source: "audit",
    level: outcome === "success" ? "info" : "warning",
    message: `auth.${action} ${outcome}`,
    action,
    outcome,
    actor,
    ipAddress,
    details
  });
}

export function recordOperatorAction({ operator = "operator", action, target, result, durationMs = 0, metadata = {} }) {
  const timestamp = new Date().toISOString();
  const roundedDuration = Number(Number(durationMs || 0).toFixed(2));
  const level = String(result || "").includes("blocked") || String(result || "").includes("not_found") ? "warning" : "info";

  pushEvent({
    id: `op-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    source: "operator-action",
    level,
    message: `${action} -> ${result}`,
    operator,
    action,
    target,
    result,
    durationMs: roundedDuration,
    metadata
  });

  try {
    appendOperatorActionLine({
      timestamp,
      operator,
      action,
      target,
      result,
      durationMs: roundedDuration
    });
  } catch (error) {
    pushEvent({
      id: `op-log-failure-${Date.now()}`,
      source: "observability",
      level: "warning",
      message: "Failed to append operator action log.",
      details: error.message
    });
  }
}

export function recordIntelligenceEvent({
  eventType = "INTELLIGENCE_SUMMARY",
  severity = "info",
  title = "",
  message = "",
  domain = "platform",
  confidenceScore = 0,
  evidence = []
}) {
  const normalizedSeverity = String(severity || "info").toLowerCase();
  const level = normalizedSeverity === "critical" ? "error" : normalizedSeverity === "high" ? "warning" : "info";

  pushEvent({
    id: `intel-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    source: "intelligence",
    level,
    eventType,
    domain,
    confidenceScore: Number(Number(confidenceScore || 0).toFixed(2)),
    message: `${eventType}: ${title || message || "Intelligence event"}`,
    details: message,
    evidence: Array.isArray(evidence) ? evidence.slice(0, 6) : []
  });
}

export function recordAssistanceEvent({
  eventType = "ASSISTANCE_RECOMMENDATION",
  severity = "info",
  title = "",
  message = "",
  domain = "operator",
  confidenceScore = 0,
  evidence = []
}) {
  const normalizedSeverity = String(severity || "info").toLowerCase();
  const level = normalizedSeverity === "urgent" || normalizedSeverity === "high" ? "warning" : "info";

  pushEvent({
    id: `assist-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    source: "assistance",
    level,
    eventType,
    domain,
    confidenceScore: Number(Number(confidenceScore || 0).toFixed(2)),
    message: `${eventType}: ${title || message || "Assistance event"}`,
    details: message,
    evidence: Array.isArray(evidence) ? evidence.slice(0, 6) : []
  });
}

export function recordReliabilityEvent({
  eventType = "RELIABILITY_TREND_SUMMARY",
  severity = "info",
  title = "",
  message = "",
  domain = "reliability",
  confidenceScore = 0,
  evidence = []
}) {
  const normalizedSeverity = String(severity || "info").toLowerCase();
  const level =
    normalizedSeverity === "critical" || normalizedSeverity === "high"
      ? "warning"
      : normalizedSeverity === "medium"
        ? "info"
        : "info";

  pushEvent({
    id: `reliability-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    source: "reliability",
    level,
    eventType,
    domain,
    confidenceScore: Number(Number(confidenceScore || 0).toFixed(2)),
    message: `${eventType}: ${title || message || "Reliability event"}`,
    details: message,
    evidence: Array.isArray(evidence) ? evidence.slice(0, 6) : []
  });
}

export function recordKnowledgeEvent({
  eventType = "KNOWLEDGE_GRAPH_BUILT",
  severity = "info",
  title = "",
  message = "",
  domain = "knowledge",
  confidenceScore = 0,
  evidence = []
}) {
  const normalizedSeverity = String(severity || "info").toLowerCase();
  const level = normalizedSeverity === "high" || normalizedSeverity === "critical" ? "warning" : "info";

  pushEvent({
    id: `knowledge-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    source: "knowledge",
    level,
    eventType,
    domain,
    confidenceScore: Number(Number(confidenceScore || 0).toFixed(2)),
    message: `${eventType}: ${title || message || "Knowledge graph event"}`,
    details: message,
    evidence: Array.isArray(evidence) ? evidence.slice(0, 6) : []
  });
}

export function recordCopilotEvent({
  eventType = "COPILOT_QUERY",
  severity = "info",
  title = "",
  message = "",
  domain = "copilot",
  confidenceScore = 0,
  evidence = []
}) {
  const normalizedSeverity = String(severity || "info").toLowerCase();
  const level = normalizedSeverity === "high" || normalizedSeverity === "critical" ? "warning" : "info";

  pushEvent({
    id: `copilot-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    source: "copilot",
    level,
    eventType,
    domain,
    confidenceScore: Number(Number(confidenceScore || 0).toFixed(2)),
    message: `${eventType}: ${title || message || "Copilot event"}`,
    details: message,
    evidence: Array.isArray(evidence) ? evidence.slice(0, 6) : []
  });
}

export function recordFabricEvent({
  eventType = "FABRIC_NODE_REGISTERED",
  severity = "info",
  title = "",
  message = "",
  domain = "fabric",
  confidenceScore = 0,
  evidence = []
}) {
  const normalizedSeverity = String(severity || "info").toLowerCase();
  const level = normalizedSeverity === "high" || normalizedSeverity === "critical" ? "warning" : "info";

  pushEvent({
    id: `fabric-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    source: "fabric",
    level,
    eventType,
    domain,
    confidenceScore: Number(Number(confidenceScore || 0).toFixed(2)),
    message: `${eventType}: ${title || message || "Fabric event"}`,
    details: message,
    evidence: Array.isArray(evidence) ? evidence.slice(0, 8) : []
  });
}

export function recordGovernanceEvent({
  eventType = "GOVERNANCE_POLICY_EVALUATED",
  severity = "info",
  title = "",
  message = "",
  domain = "governance",
  confidenceScore = 0,
  evidence = []
}) {
  const normalizedSeverity = String(severity || "info").toLowerCase();
  const level = normalizedSeverity === "high" || normalizedSeverity === "critical" ? "warning" : "info";

  pushEvent({
    id: `governance-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    source: "governance",
    level,
    eventType,
    domain,
    confidenceScore: Number(Number(confidenceScore || 0).toFixed(2)),
    message: `${eventType}: ${title || message || "Governance event"}`,
    details: message,
    evidence: Array.isArray(evidence) ? evidence.slice(0, 10) : []
  });
}

export function getLatencyMetrics(pathname = "") {
  const target = String(pathname || "");
  const stat = routeStats.get(target);

  if (!stat) {
    return {
      path: target,
      count: 0,
      avgDurationMs: 0,
      maxDurationMs: 0,
      lastStatusCode: 0,
      lastDurationMs: 0
    };
  }

  return {
    path: target,
    count: stat.count,
    avgDurationMs: Number((stat.totalDurationMs / stat.count).toFixed(2)),
    maxDurationMs: stat.maxDurationMs,
    lastStatusCode: stat.lastStatusCode,
    lastDurationMs: stat.lastDurationMs
  };
}

export function getRouteMetrics(limit = 50) {
  return Array.from(routeStats.values())
    .map((stat) => ({
      path: stat.path,
      count: stat.count,
      avgDurationMs: Number((stat.totalDurationMs / stat.count).toFixed(2)),
      maxDurationMs: stat.maxDurationMs,
      lastStatusCode: stat.lastStatusCode,
      lastDurationMs: stat.lastDurationMs
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function getRecentEvents({ limit = 200, levels = [] } = {}) {
  const allowed = new Set(levels);
  const filtered = allowed.size > 0 ? events.filter((event) => allowed.has(event.level)) : events;
  return filtered.slice(-limit).reverse();
}

export function getObservabilitySnapshot() {
  return {
    generatedAt: new Date().toISOString(),
    totalEvents: events.length,
    routeMetrics: getRouteMetrics(100)
  };
}
