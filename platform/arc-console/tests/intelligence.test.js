import assert from "node:assert/strict";
import test from "node:test";
import { analyzeAgentActivity } from "../server/intelligence/agentActivityAnalyzer.js";
import { analyzeDependencyRisk } from "../server/intelligence/dependencyRiskAnalyzer.js";
import { generatePlatformInsights } from "../server/intelligence/platformInsightsEngine.js";
import { analyzeRepositoryDrift } from "../server/intelligence/repoDriftDetector.js";
import { analyzeServiceTrends } from "../server/intelligence/serviceTrendAnalyzer.js";

test("service trend analyzer emits evidence and confidence", () => {
  const payload = analyzeServiceTrends();

  assert.ok(Array.isArray(payload.items));
  if (payload.items.length > 0) {
    const first = payload.items[0];
    assert.equal(typeof first.service, "string");
    assert.equal(typeof first.stability_score, "number");
    assert.equal(typeof first.confidence_score, "number");
    assert.ok(Array.isArray(first.evidence));
  }
});

test("repository drift analyzer emits drift findings with advisory action", () => {
  const payload = analyzeRepositoryDrift();

  assert.ok(Array.isArray(payload.items));
  if (payload.items.length > 0) {
    const first = payload.items[0];
    assert.equal(typeof first.repository, "string");
    assert.equal(typeof first.drift_type, "string");
    assert.equal(typeof first.risk_level, "string");
    assert.equal(first.recommended_action.operator_approval_required, true);
  }
});

test("dependency risk analyzer emits risk score and recommendation", () => {
  const payload = analyzeDependencyRisk();

  assert.ok(Array.isArray(payload.items));
  if (payload.items.length > 0) {
    const first = payload.items[0];
    assert.equal(typeof first.package, "string");
    assert.equal(typeof first.risk_score, "number");
    assert.equal(typeof first.recommended_version, "string");
    assert.equal(first.operator_approval_required, true);
  }
});

test("agent activity analyzer emits success rate and trend", () => {
  const payload = analyzeAgentActivity();

  assert.ok(Array.isArray(payload.items));
  if (payload.items.length > 0) {
    const first = payload.items[0];
    assert.equal(typeof first.agent, "string");
    assert.equal(typeof first.tasks_run, "number");
    assert.equal(typeof first.success_rate, "number");
    assert.equal(typeof first.activity_trend, "string");
  }
});

test("platform insights remain advisory and approval-gated", () => {
  const payload = generatePlatformInsights();

  assert.ok(Array.isArray(payload.top_risks));
  assert.ok(Array.isArray(payload.recommended_actions));

  for (const action of payload.recommended_actions) {
    assert.equal(action.operator_approval_required, true);
    assert.equal(typeof action.confidence_score, "number");
  }
});
