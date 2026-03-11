import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { env } from "../server/config/env.js";
import { registerFabricNode, updateFabricNodeRecord } from "../server/fabric/nodeRegistry.js";
import { ingestFabricNodeTelemetry } from "../server/fabric/nodeTelemetryAggregator.js";
import { computeGovernanceCompliance } from "../server/governance/complianceScorer.js";
import { detectGovernanceDrift } from "../server/governance/driftDetector.js";
import { evaluateGovernancePolicies } from "../server/governance/policyEvaluator.js";
import { getGovernancePolicies } from "../server/governance/policyRegistry.js";
import { getGovernanceViolations } from "../server/governance/violationReporter.js";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "arc-governance-tests-"));
const policyPath = path.join(tempDir, "governance-policies.json");

env.fabricNodeRegistryPath = path.join(tempDir, "fabric-node-registry.json");
env.fabricTelemetryStorePath = path.join(tempDir, "fabric-telemetry-store.json");
env.governanceComplianceHistoryPath = path.join(tempDir, "governance-compliance-history.json");
env.fabricNodeRegistrationToken = "TEST_FABRIC_TOKEN";
env.governancePolicyFilePath = policyPath;

env.governanceHeartbeatMaxOfflineNodes = 0;
env.governanceHeartbeatMaxDegradedNodes = 0;
env.governanceServiceMaxDegradedServices = 0;
env.governanceRepoMaxStaleRepositories = 0;
env.governanceDependencyMaxHighRisk = 0;
env.governanceAgentMaxStalledAgents = 0;

function resetStore() {
  fs.rmSync(env.fabricNodeRegistryPath, { force: true });
  fs.rmSync(env.fabricTelemetryStorePath, { force: true });
  fs.rmSync(env.governanceComplianceHistoryPath, { force: true });
  fs.rmSync(policyPath, { force: true });
}

test.beforeEach(() => {
  resetStore();
});

test("policy registry loads defaults and supports override file", { concurrency: false }, () => {
  fs.writeFileSync(
    policyPath,
    JSON.stringify(
      {
        policies: [
          {
            policy_id: "node_heartbeat_threshold",
            threshold: { max_offline_nodes: 2, max_degraded_nodes: 2 }
          }
        ]
      },
      null,
      2
    )
  );

  const payload = getGovernancePolicies();
  const policy = payload.items.find((item) => item.policy_id === "node_heartbeat_threshold");

  assert.ok(policy);
  assert.equal(policy.threshold.max_offline_nodes, 2);
  assert.equal(payload.summary.active >= 1, true);
});

test("policy evaluator returns evidence-backed status rows", { concurrency: false }, () => {
  registerFabricNode({
    node_id: "workspace-node",
    node_type: "workspace-node",
    hostname: "workspace.local",
    capabilities: ["telemetry"],
    token: "TEST_FABRIC_TOKEN"
  });

  ingestFabricNodeTelemetry({
    nodeId: "workspace-node",
    token: "TEST_FABRIC_TOKEN",
    telemetry: {
      services: [{ name: "arc-console", status: "degraded" }],
      warnings: ["degraded sample"]
    }
  });

  const payload = evaluateGovernancePolicies({ forceRefresh: true });
  assert.equal(Array.isArray(payload.items), true);
  assert.equal(payload.summary.total >= 1, true);

  const first = payload.items[0];
  assert.equal(typeof first.policy_id, "string");
  assert.equal(typeof first.status, "string");
  assert.equal(Array.isArray(first.evidence), true);
  assert.equal(typeof first.confidence, "number");
});

test("drift detector surfaces component drift findings", { concurrency: false }, () => {
  registerFabricNode({
    node_id: "worker-node",
    node_type: "agent-worker-node",
    hostname: "worker.local",
    capabilities: ["telemetry"],
    token: "TEST_FABRIC_TOKEN"
  });

  updateFabricNodeRecord("worker-node", {
    last_seen: new Date(Date.now() - 120_000).toISOString()
  });

  const payload = detectGovernanceDrift({ forceRefresh: true });
  assert.equal(Array.isArray(payload.items), true);
  assert.equal(payload.items.length >= 1, true);

  const first = payload.items[0];
  assert.equal(typeof first.component, "string");
  assert.equal(typeof first.drift_type, "string");
  assert.equal(typeof first.severity, "string");
  assert.equal(Array.isArray(first.evidence), true);
});

test("compliance scorer computes score and trend", { concurrency: false }, () => {
  const first = computeGovernanceCompliance({
    forceRefresh: true,
    persistHistory: true
  });

  const second = computeGovernanceCompliance({
    forceRefresh: true,
    persistHistory: true
  });

  assert.equal(typeof first.overall_score, "number");
  assert.equal(typeof first.node_score, "number");
  assert.equal(typeof first.service_score, "number");
  assert.equal(typeof first.repo_score, "number");
  assert.equal(typeof second.trend, "string");
  assert.equal(Array.isArray(second.history), true);
});

test("violation reporter aggregates policy and drift violations", { concurrency: false }, () => {
  registerFabricNode({
    node_id: "ci-runner-node",
    node_type: "ci-runner-node",
    hostname: "ci.local",
    capabilities: ["telemetry"],
    token: "TEST_FABRIC_TOKEN"
  });

  updateFabricNodeRecord("ci-runner-node", {
    last_seen: new Date(Date.now() - 120_000).toISOString()
  });

  const payload = getGovernanceViolations({ forceRefresh: true });
  assert.equal(Array.isArray(payload.items), true);

  if (payload.items.length > 0) {
    const first = payload.items[0];
    assert.equal(typeof first.violation_id, "string");
    assert.equal(typeof first.policy, "string");
    assert.equal(typeof first.recommended_action, "string");
    assert.equal(Array.isArray(first.evidence), true);
  }
});

test.after(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});
