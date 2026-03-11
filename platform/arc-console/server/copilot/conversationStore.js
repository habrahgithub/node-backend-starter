import fs from "fs";
import path from "path";
import { env } from "../config/env.js";

const MAX_ITEMS = 200;

function safeReadHistory() {
  const filePath = env.copilotConversationStorePath;

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

function safeWriteHistory(items) {
  const filePath = env.copilotConversationStorePath;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(items, null, 2), "utf8");
}

function toSummary(response) {
  return {
    query_type: response.query_type,
    answer: String(response.answer || "").slice(0, 280),
    confidence: Number(response.confidence || 0),
    action_mode: response.action_mode,
    warning_count: Array.isArray(response.warnings) ? response.warnings.length : 0
  };
}

export function recordConversation({ operator = "operator", query, response }) {
  const items = safeReadHistory();

  const entry = {
    id: `copilot-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    at: new Date().toISOString(),
    operator,
    query: String(query || "").trim().slice(0, 2000),
    response_summary: toSummary(response)
  };

  const next = [entry, ...items].slice(0, MAX_ITEMS);
  safeWriteHistory(next);

  return entry;
}

export function getConversationHistory() {
  const items = safeReadHistory();

  return {
    generatedAt: new Date().toISOString(),
    mode: "local_only",
    items,
    summary: {
      total: items.length,
      latest_at: items[0]?.at || null
    }
  };
}
