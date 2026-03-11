import assert from "node:assert/strict";
import test from "node:test";
import { detectIncidentPatterns } from "../server/reliability/incidentPatternDetector.js";
import {
  getIncidentLearningLedger,
  recordIncidentLearningEntry,
  validateLearningRecordPayload
} from "../server/reliability/incidentLearningLedger.js";
import { getRemediationPlaybooks } from "../server/reliability/remediationPlaybookEngine.js";
import { analyzeReliabilityTrends } from "../server/reliability/reliabilityTrendAnalyzer.js";
import { getServiceRecoveryAdvice } from "../server/reliability/serviceRecoveryAdvisor.js";

test("incident pattern detector emits evidence and confidence", () => {
  const payload = detectIncidentPatterns();

  assert.ok(Array.isArray(payload.items));
  if (payload.items.length > 0) {
    const first = payload.items[0];
    assert.equal(typeof first.incident_id, "string");
    assert.equal(typeof first.service, "string");
    assert.equal(typeof first.pattern_type, "string");
    assert.ok(Array.isArray(first.evidence));
    assert.equal(typeof first.confidence, "number");
  }
});

test("remediation playbooks are approval-required", () => {
  const payload = getRemediationPlaybooks();

  assert.ok(Array.isArray(payload.items));
  if (payload.items.length > 0) {
    const first = payload.items[0];
    assert.equal(first.approval_required, true);
    assert.ok(Array.isArray(first.recommended_steps));
    assert.ok(Array.isArray(first.rollback_checks));
  }
});

test("reliability trends include risk-level scoring", () => {
  const payload = analyzeReliabilityTrends();

  assert.ok(Array.isArray(payload.items));
  if (payload.items.length > 0) {
    const first = payload.items[0];
    assert.equal(typeof first.reliability_score, "number");
    assert.equal(typeof first.risk_level, "string");
    assert.equal(typeof first.warning_count, "number");
  }
});

test("service recovery advice stays advisory and approval-gated", () => {
  const payload = getServiceRecoveryAdvice();

  assert.ok(Array.isArray(payload.items));
  if (payload.items.length > 0) {
    const first = payload.items[0];
    assert.equal(first.approval_required, true);
    assert.equal(typeof first.action_mode, "string");
    assert.ok(Array.isArray(first.prerequisites));
  }
});

test("learning ledger payload validation rejects bad input", () => {
  const check = validateLearningRecordPayload({ incident_id: "", lesson: "", prevention_recommendation: "" });

  assert.equal(check.valid, false);
  assert.ok(check.errors.length > 0);
});

test("learning ledger record endpoint helper returns errors for invalid payload", () => {
  const result = recordIncidentLearningEntry({ incident_id: "" }, { operator: "tester" });

  assert.equal(result.ok, false);
  assert.ok(Array.isArray(result.errors));
});

test("learning ledger read is resilient", () => {
  const payload = getIncidentLearningLedger();

  assert.ok(Array.isArray(payload.items));
  assert.equal(typeof payload.summary.total, "number");
});
