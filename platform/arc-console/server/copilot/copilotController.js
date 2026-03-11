import { assembleCopilotContext } from "./contextAssembler.js";
import { getConversationHistory, recordConversation } from "./conversationStore.js";
import { classifyCopilotQuery, getCopilotSuggestions, getDataSourcesForQueryType } from "./queryRouter.js";
import { generateCopilotReasoning } from "./reasoningEngine.js";
import { formatCopilotResponse } from "./responseFormatter.js";
import { recordCopilotEvent } from "../services/observability.js";

const FORBIDDEN_HINTS = ["token", "secret", "password", "api key", "private key"];

function looksSensitive(query) {
  const normalized = String(query || "").toLowerCase();
  return FORBIDDEN_HINTS.some((hint) => normalized.includes(hint));
}

export async function queryCopilotController(req, res) {
  try {
    const query = String(req.body?.query || "").trim();
    const mode = String(req.body?.mode || "concise").trim().toLowerCase();

    if (!query) {
      return res.status(400).json({
        error: "invalid_request",
        message: "query is required"
      });
    }

    if (looksSensitive(query)) {
      const safe = {
        query_type: "sensitive_request",
        answer: "This request may involve sensitive values. Copilot will not reveal or process secrets directly.",
        facts: ["Sensitive-value requests are blocked by policy."],
        inferences: [],
        recommended_actions: ["Use secure secret management tooling and review logs without exposing secret contents."],
        confidence: 0.9,
        action_mode: "approval-required",
        evidence_sources: [],
        warnings: ["Sensitive request blocked by copilot safety policy."],
        timestamp: new Date().toISOString()
      };

      recordCopilotEvent({
        eventType: "COPILOT_WARNING",
        severity: "high",
        title: "sensitive query blocked",
        message: "Copilot blocked sensitive-value request.",
        domain: "copilot",
        confidenceScore: 0.9,
        evidence: ["safety_policy_block"]
      });

      recordConversation({
        operator: req.arcSession?.username || "operator",
        query,
        response: safe
      });

      return res.json(safe);
    }

    const queryType = classifyCopilotQuery(query);
    const sources = getDataSourcesForQueryType(queryType);

    recordCopilotEvent({
      eventType: "COPILOT_QUERY",
      severity: "info",
      title: `query received (${queryType})`,
      message: query.slice(0, 220),
      domain: queryType,
      confidenceScore: 0.8,
      evidence: [`sources=${sources.join(",")}`]
    });

    const context = await assembleCopilotContext({ queryType, sources });
    const reasoning = generateCopilotReasoning({ queryType, context });
    const response = formatCopilotResponse({ query, queryType, reasoning, mode });

    recordConversation({
      operator: req.arcSession?.username || "operator",
      query,
      response
    });

    recordCopilotEvent({
      eventType: "COPILOT_RESPONSE",
      severity: response.warnings.length > 0 ? "medium" : "info",
      title: `response generated (${response.query_type})`,
      message: response.answer.slice(0, 240),
      domain: response.query_type,
      confidenceScore: response.confidence,
      evidence: response.evidence_sources
    });

    if (response.warnings.length > 0) {
      recordCopilotEvent({
        eventType: "COPILOT_WARNING",
        severity: "medium",
        title: "context assembly warnings",
        message: response.warnings.join(" | ").slice(0, 360),
        domain: response.query_type,
        confidenceScore: response.confidence,
        evidence: response.evidence_sources
      });
    }

    return res.json(response);
  } catch (error) {
    recordCopilotEvent({
      eventType: "COPILOT_WARNING",
      severity: "high",
      title: "copilot query failure",
      message: error.message,
      domain: "copilot",
      confidenceScore: 0.3,
      evidence: ["controller_exception"]
    });

    return res.status(503).json({
      error: "copilot_query_unavailable",
      message: "Copilot query processing is unavailable.",
      details: error.message
    });
  }
}

export function getCopilotSuggestionsController(_req, res) {
  res.json({
    generatedAt: new Date().toISOString(),
    items: getCopilotSuggestions()
  });
}

export function getCopilotHistoryController(_req, res) {
  try {
    res.json(getConversationHistory());
  } catch (error) {
    res.status(503).json({
      error: "copilot_history_unavailable",
      message: "Copilot history is unavailable.",
      details: error.message
    });
  }
}
