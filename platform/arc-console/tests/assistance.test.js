import assert from "node:assert/strict";
import test from "node:test";
import { getServiceDiagnosticGuidance } from "../server/assistance/diagnosticCopilot.js";
import { getAssistedInsights } from "../server/assistance/insightInterpreter.js";
import { getOperatorAlerts } from "../server/assistance/operatorNotifier.js";
import { getRepositoryCleanupAdvice } from "../server/assistance/repoCleanupAdvisor.js";
import { getWorkflowGuidance } from "../server/assistance/workflowAdvisor.js";

test("insight interpreter emits evidence-backed recommendations", () => {
  const payload = getAssistedInsights();

  assert.ok(Array.isArray(payload.items));
  if (payload.items.length > 0) {
    const first = payload.items[0];
    assert.equal(typeof first.risk, "string");
    assert.equal(typeof first.recommended_action, "string");
    assert.equal(typeof first.confidence, "number");
    assert.ok(Array.isArray(first.evidence));
    assert.equal(first.operator_approval_required, true);
  }
});

test("diagnostic copilot returns guided steps", () => {
  const payload = getServiceDiagnosticGuidance();

  assert.ok(Array.isArray(payload.items));
  if (payload.items.length > 0) {
    const first = payload.items[0];
    assert.equal(typeof first.service, "string");
    assert.ok(Array.isArray(first.diagnostic_steps));
    assert.equal(typeof first.confidence, "number");
    assert.equal(first.operator_approval_required, true);
  }
});

test("repo cleanup advisor emits governance guidance", () => {
  const payload = getRepositoryCleanupAdvice();

  assert.ok(Array.isArray(payload.items));
  if (payload.items.length > 0) {
    const first = payload.items[0];
    assert.equal(typeof first.repository, "string");
    assert.equal(typeof first.suggested_cleanup, "string");
    assert.ok(Array.isArray(first.guidance_steps));
    assert.equal(first.operator_approval_required, true);
  }
});

test("workflow advisor keeps suggestions approval-gated", () => {
  const payload = getWorkflowGuidance();

  assert.ok(Array.isArray(payload.items));
  if (payload.items.length > 0) {
    const first = payload.items[0];
    assert.equal(typeof first.workflow, "string");
    assert.equal(typeof first.reason, "string");
    assert.equal(first.operator_approval_required, true);
  }
});

test("operator notifier prioritizes alerts", () => {
  const payload = getOperatorAlerts();

  assert.ok(Array.isArray(payload.items));
  if (payload.items.length > 0) {
    const first = payload.items[0];
    assert.equal(typeof first.level, "string");
    assert.equal(typeof first.next_action, "string");
    assert.equal(typeof first.confidence, "number");
    assert.equal(first.operator_approval_required, true);
  }
});
