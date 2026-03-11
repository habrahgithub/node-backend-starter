import fs from "fs";
import path from "path";
import { env } from "../config/env.js";

function sanitizeText(value, maxLength = 2000) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function safeReadLedger() {
  const filePath = env.reliabilityLearningLedgerPath;

  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWriteLedger(items) {
  const filePath = env.reliabilityLearningLedgerPath;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(items, null, 2), "utf8");
}

function summarize(items) {
  return {
    total: items.length,
    highConfidence: items.filter((item) => Number(item.confidence || 0) >= 0.8).length,
    uniqueIncidents: new Set(items.map((item) => item.incident_id)).size
  };
}

export function validateLearningRecordPayload(payload) {
  const errors = [];

  const incidentId = sanitizeText(payload?.incident_id, 120);
  const lesson = sanitizeText(payload?.lesson, 2000);
  const preventionRecommendation = sanitizeText(payload?.prevention_recommendation, 2000);
  const confidence = Number(payload?.confidence ?? 0.7);
  const evidence = Array.isArray(payload?.evidence)
    ? payload.evidence.map((item) => sanitizeText(item, 240)).filter(Boolean).slice(0, 12)
    : [];

  if (!incidentId) {
    errors.push("incident_id is required");
  }

  if (!lesson) {
    errors.push("lesson is required");
  }

  if (!preventionRecommendation) {
    errors.push("prevention_recommendation is required");
  }

  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    errors.push("confidence must be a number between 0 and 1");
  }

  return {
    valid: errors.length === 0,
    errors,
    normalized: {
      incident_id: incidentId,
      lesson,
      prevention_recommendation: preventionRecommendation,
      confidence: Number(Math.max(0, Math.min(1, confidence)).toFixed(2)),
      evidence
    }
  };
}

export function getIncidentLearningLedger() {
  const items = safeReadLedger();

  return {
    generatedAt: new Date().toISOString(),
    mode: "local_learning_history",
    items,
    summary: summarize(items)
  };
}

export function recordIncidentLearningEntry(payload, { operator = "operator" } = {}) {
  const validation = validateLearningRecordPayload(payload);
  if (!validation.valid) {
    return {
      ok: false,
      errors: validation.errors
    };
  }

  const items = safeReadLedger();
  const record = {
    id: `learn-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    created_at: new Date().toISOString(),
    operator,
    ...validation.normalized
  };

  const nextItems = [record, ...items].slice(0, 500);
  safeWriteLedger(nextItems);

  return {
    ok: true,
    record,
    summary: summarize(nextItems)
  };
}
