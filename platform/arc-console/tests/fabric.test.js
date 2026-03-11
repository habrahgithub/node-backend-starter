import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { env } from "../server/config/env.js";
import { getFabricTopologyMap } from "../server/fabric/fabricTopologyMap.js";
import { recordFabricNodeHeartbeat, refreshFabricNodeSignals } from "../server/fabric/nodeHeartbeatMonitor.js";
import { routeFabricQuery } from "../server/fabric/nodeQueryRouter.js";
import {
  getFabricNodeById,
  listFabricNodes,
  registerFabricNode,
  updateFabricNodeRecord
} from "../server/fabric/nodeRegistry.js";
import { getFabricTelemetry, ingestFabricNodeTelemetry } from "../server/fabric/nodeTelemetryAggregator.js";

const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "arc-fabric-tests-"));

env.fabricNodeRegistryPath = path.join(testDataDir, "fabric-node-registry.json");
env.fabricTelemetryStorePath = path.join(testDataDir, "fabric-telemetry-store.json");
env.fabricNodeRegistrationToken = "TEST_FABRIC_TOKEN";
env.fabricHeartbeatDegradedSeconds = 1;
env.fabricHeartbeatOfflineSeconds = 2;

function resetStores() {
  fs.rmSync(env.fabricNodeRegistryPath, { force: true });
  fs.rmSync(env.fabricTelemetryStorePath, { force: true });
}

test.beforeEach(() => {
  resetStores();
});

test("fabric node registry enforces registration token and duplicate prevention", { concurrency: false }, () => {
  const bad = registerFabricNode({
    node_id: "workspace-node",
    node_type: "workspace-node",
    hostname: "workspace.local",
    token: "wrong"
  });
  assert.equal(bad.ok, false);
  assert.equal(bad.status, "unauthorized");

  const first = registerFabricNode({
    node_id: "workspace-node",
    node_type: "workspace-node",
    hostname: "workspace.local",
    capabilities: ["telemetry", "query"],
    token: "TEST_FABRIC_TOKEN"
  });
  assert.equal(first.ok, true);
  assert.equal(first.node.node_id, "workspace-node");

  const duplicate = registerFabricNode({
    node_id: "workspace-node",
    node_type: "workspace-node",
    hostname: "workspace.local",
    token: "TEST_FABRIC_TOKEN"
  });
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.status, "duplicate");
});

test("fabric heartbeat validates node token and updates status", { concurrency: false }, () => {
  registerFabricNode({
    node_id: "agent-worker-node",
    node_type: "agent-worker-node",
    hostname: "agent.local",
    capabilities: ["agents"],
    token: "TEST_FABRIC_TOKEN"
  });

  const blocked = recordFabricNodeHeartbeat({
    nodeId: "agent-worker-node",
    token: "invalid"
  });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.status, "unauthorized");

  const success = recordFabricNodeHeartbeat({
    nodeId: "agent-worker-node",
    token: "TEST_FABRIC_TOKEN"
  });
  assert.equal(success.ok, true);
  assert.equal(success.status, "online");
});

test("fabric telemetry aggregation is read-only and resilient", { concurrency: false }, () => {
  registerFabricNode({
    node_id: "ci-runner-node",
    node_type: "ci-runner-node",
    hostname: "ci.local",
    capabilities: ["ci", "telemetry"],
    token: "TEST_FABRIC_TOKEN"
  });

  const ingest = ingestFabricNodeTelemetry({
    nodeId: "ci-runner-node",
    token: "TEST_FABRIC_TOKEN",
    telemetry: {
      services: [
        { name: "docsmith-payment-gateway", status: "operational", latency_ms: 41 },
        { name: "docsmith-licensing-service", status: "degraded", warning_count: 2 }
      ],
      repositories: [{ name: "workspace", status: "dirty" }],
      metrics: { cpu: 32, memory: 61 },
      warnings: ["ci queue delay"]
    }
  });

  assert.equal(ingest.ok, true);

  const telemetry = getFabricTelemetry();
  assert.equal(Array.isArray(telemetry.items), true);
  assert.equal(telemetry.summary.nodes_total, 1);
  assert.equal(telemetry.summary.services_total, 2);
  assert.equal(telemetry.summary.services_degraded, 1);
});

test("fabric query router returns merged results", { concurrency: false }, () => {
  registerFabricNode({
    node_id: "cloud-service-node",
    node_type: "cloud-service-node",
    hostname: "cloud.local",
    capabilities: ["services", "telemetry"],
    token: "TEST_FABRIC_TOKEN"
  });

  ingestFabricNodeTelemetry({
    nodeId: "cloud-service-node",
    token: "TEST_FABRIC_TOKEN",
    telemetry: {
      services: [{ name: "swd-finstack", status: "operational" }],
      metrics: { cpu: 22 }
    }
  });

  const response = routeFabricQuery({
    query: "show services status across all nodes"
  });

  assert.equal(response.query_type, "service_status");
  assert.equal(Array.isArray(response.results), true);
  assert.equal(response.results.length, 1);
  assert.equal(response.action_mode, "informational");
});

test("fabric topology map includes control-plane relationships", { concurrency: false }, () => {
  registerFabricNode({
    node_id: "local-control-node",
    node_type: "local-control-node",
    hostname: "local.arc",
    capabilities: ["registry", "telemetry"],
    token: "TEST_FABRIC_TOKEN"
  });

  const topology = getFabricTopologyMap();

  assert.equal(Array.isArray(topology.nodes), true);
  assert.equal(Array.isArray(topology.relationships), true);
  assert.equal(topology.nodes.some((node) => node.id === "control:arc-console"), true);
  assert.equal(topology.relationships.some((edge) => edge.relationship === "manages"), true);
});

test("offline node handling transitions status safely", { concurrency: false }, () => {
  registerFabricNode({
    node_id: "workspace-node",
    node_type: "workspace-node",
    hostname: "workspace.local",
    capabilities: ["telemetry"],
    token: "TEST_FABRIC_TOKEN"
  });

  updateFabricNodeRecord("workspace-node", {
    last_seen: new Date(Date.now() - 120_000).toISOString()
  });

  const transitions = refreshFabricNodeSignals();
  assert.equal(Array.isArray(transitions), true);

  const lookup = getFabricNodeById("workspace-node");
  assert.equal(lookup.item.status, "offline");

  const list = listFabricNodes();
  assert.equal(list.summary.offline >= 1, true);
});

test.after(() => {
  fs.rmSync(testDataDir, { recursive: true, force: true });
});
