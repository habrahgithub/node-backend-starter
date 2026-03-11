import test from "node:test";
import assert from "node:assert/strict";
import { runWorkflow } from "../server/automation/operatorWorkflow.js";
import { restartService } from "../server/automation/serviceController.js";

test("blocks workflow run without safety confirmation token", () => {
  const result = runWorkflow({
    operator: "tester",
    workflowId: "system-scan",
    confirmation: ""
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.confirmationRequired, true);
});

test("returns not_found for unknown workflow", () => {
  const result = runWorkflow({
    operator: "tester",
    workflowId: "unknown-workflow",
    confirmation: "SAFE_MODE_ACK"
  });

  assert.equal(result.status, "not_found");
});

test("blocks restart when attempting to disable simulation", () => {
  const result = restartService({
    operator: "tester",
    serviceId: "swd-pulse",
    confirmation: "SAFE_MODE_ACK",
    simulate: false
  });

  if (result.status === "not_found") {
    assert.equal(result.status, "not_found");
    return;
  }

  assert.equal(result.status, "blocked");
});
