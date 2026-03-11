import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { env } from "../server/config/env.js";
import { formatCopilotResponse } from "../server/copilot/responseFormatter.js";
import { classifyCopilotQuery, getCopilotSuggestions } from "../server/copilot/queryRouter.js";
import { generateCopilotReasoning } from "../server/copilot/reasoningEngine.js";

test("copilot query router classifies known query types", () => {
  assert.equal(classifyCopilotQuery("What services are currently unstable?"), "service_diagnostics");
  assert.equal(classifyCopilotQuery("Which repositories show governance drift?"), "repo_governance");
  assert.equal(classifyCopilotQuery("Show incidents affecting payment services."), "incident_analysis");
});

test("copilot suggestions include required operator prompts", () => {
  const suggestions = getCopilotSuggestions();

  assert.equal(Array.isArray(suggestions), true);
  assert.equal(suggestions.length >= 5, true);
  assert.equal(suggestions.includes("What services are currently unstable?"), true);
  assert.equal(suggestions.includes("Which workflows should I run next?"), true);
});

test("copilot response formatter returns required response contract fields", () => {
  const response = formatCopilotResponse({
    query: "What should I do next?",
    queryType: "workflow_suggestion",
    mode: "expanded",
    reasoning: {
      answer: "Use operator-approved workflows only.",
      facts: ["workflow signals available"],
      inferences: ["platform has pending risk items"],
      recommended_actions: ["Review workflow recommendations."],
      confidence: 0.83,
      action_mode: "approval-required",
      evidence_sources: ["assistance_workflows"],
      warnings: []
    }
  });

  assert.equal(response.query_type, "workflow_suggestion");
  assert.equal(typeof response.answer, "string");
  assert.equal(Array.isArray(response.facts), true);
  assert.equal(Array.isArray(response.inferences), true);
  assert.equal(Array.isArray(response.recommended_actions), true);
  assert.equal(typeof response.confidence, "number");
  assert.equal(typeof response.action_mode, "string");
  assert.equal(Array.isArray(response.evidence_sources), true);
  assert.equal(Array.isArray(response.warnings), true);
  assert.equal(typeof response.timestamp, "string");
});

test("copilot reasoning engine separates facts and inferences", () => {
  const reasoning = generateCopilotReasoning({
    queryType: "system_status",
    context: {
      data: {
        system: {
          services: [{ id: "svc-1" }],
          repositories: [{ id: "repo-1" }],
          warnings: []
        },
        health: {
          overall: "warning",
          repositoryActivity: { dirty: 1 },
          serviceAvailability: { degraded: 1 }
        }
      },
      evidenceSources: ["system", "health"],
      warnings: []
    }
  });

  assert.equal(Array.isArray(reasoning.facts), true);
  assert.equal(Array.isArray(reasoning.inferences), true);
  assert.equal(Array.isArray(reasoning.recommended_actions), true);
  assert.equal(typeof reasoning.confidence, "number");
  assert.equal(typeof reasoning.action_mode, "string");
  assert.equal(reasoning.facts.length > 0, true);
});

test("conversation store records local history", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "arc-copilot-test-"));
  const storePath = path.join(tempDir, "conversations.json");
  env.copilotConversationStorePath = storePath;

  const moduleUrl = new URL(`../server/copilot/conversationStore.js?ts=${Date.now()}`, import.meta.url);
  const { getConversationHistory, recordConversation } = await import(moduleUrl.href);

  recordConversation({
    operator: "tester",
    query: "Summarize current risks.",
    response: {
      query_type: "general",
      answer: "No high-severity risks.",
      confidence: 0.7,
      action_mode: "informational",
      warnings: []
    }
  });

  const history = getConversationHistory();
  assert.equal(history.mode, "local_only");
  assert.equal(Array.isArray(history.items), true);
  assert.equal(history.items.length >= 1, true);
  assert.equal(history.items[0].operator, "tester");

  fs.rmSync(tempDir, { recursive: true, force: true });
});
