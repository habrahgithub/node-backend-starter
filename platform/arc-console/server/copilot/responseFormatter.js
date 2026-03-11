function truncate(value, length = 220) {
  const input = String(value || "").trim();
  if (input.length <= length) {
    return input;
  }
  return `${input.slice(0, length - 3)}...`;
}

export function formatCopilotResponse({ query, queryType, reasoning, mode = "concise" }) {
  const normalizedMode = mode === "expanded" ? "expanded" : "concise";
  const isConcise = normalizedMode === "concise";

  const response = {
    query_type: queryType,
    answer: isConcise ? truncate(reasoning.answer, 260) : reasoning.answer,
    facts: isConcise ? (reasoning.facts || []).slice(0, 5).map((item) => truncate(item, 180)) : reasoning.facts || [],
    inferences: isConcise
      ? (reasoning.inferences || []).slice(0, 4).map((item) => truncate(item, 180))
      : reasoning.inferences || [],
    recommended_actions: isConcise
      ? (reasoning.recommended_actions || []).slice(0, 4).map((item) => truncate(item, 220))
      : reasoning.recommended_actions || [],
    confidence: Number(Number(reasoning.confidence || 0).toFixed(2)),
    action_mode: reasoning.action_mode || "informational",
    evidence_sources: reasoning.evidence_sources || [],
    warnings: reasoning.warnings || [],
    timestamp: new Date().toISOString()
  };

  if (String(query || "").trim()) {
    response.query = String(query).trim();
  }

  return response;
}
