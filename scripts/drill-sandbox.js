#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");

function nowStamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function requireEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function assertSandboxUrl(name, value) {
  const host = hostOf(value);
  if (!host || !host.toLowerCase().includes("sandbox")) {
    throw new Error(`${name} must point to sandbox host. Got: ${value}`);
  }
}

function sqlLit(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function psqlScalar(dbUrl, sql) {
  const out = execFileSync("psql", [dbUrl, "-At", "-c", sql], { encoding: "utf8" }).trim();
  const line = out.split("\n").filter(Boolean).pop() || "";
  return line.trim();
}

function psqlExec(dbUrl, sql) {
  execFileSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1", "-c", sql], { stdio: "pipe" });
}

function statusDistribution(items) {
  const counts = new Map();
  for (const item of items) {
    const key = String(item.status || "ERR");
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort((a, b) => Number(a[0]) - Number(b[0])));
}

async function parallelPost(url, headers, bodyFactory, count) {
  const tasks = [];
  for (let i = 0; i < count; i += 1) {
    tasks.push(
      fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(bodyFactory(i)),
      })
        .then(async (res) => ({
          ok: res.ok,
          status: res.status,
          body: await res.text(),
        }))
        .catch((error) => ({ ok: false, status: "ERR", body: String(error?.message || error) }))
    );
  }
  return Promise.all(tasks);
}

function writeReport(outDir, fileName, title, payload) {
  const target = path.join(outDir, fileName);
  const lines = [];
  lines.push(`# ${title}`);
  lines.push(`generated_at_utc=${new Date().toISOString()}`);
  lines.push("");
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "object" && value !== null) {
      lines.push(`${key}=${JSON.stringify(value)}`);
    } else {
      lines.push(`${key}=${value}`);
    }
  }
  lines.push("");
  fs.writeFileSync(target, lines.join("\n"), "utf8");
}

async function main() {
  const gatewayUrl = String(process.env.SANDBOX_GATEWAY_URL || "https://gateway-sandbox-production.up.railway.app").trim();
  const licensingUrl = String(process.env.SANDBOX_LICENSING_URL || "https://licensing-sandbox-production.up.railway.app").trim();
  const gatewayDbUrl = requireEnv("SANDBOX_GATEWAY_DB_URL");
  const licensingDbUrl = requireEnv("SANDBOX_LICENSING_DB_URL");
  const licensingApiToken = requireEnv("SANDBOX_LICENSING_API_TOKEN");
  const paymentGatewayApiToken = requireEnv("SANDBOX_PAYMENT_GATEWAY_API_TOKEN");
  const webhookSecret = requireEnv("SANDBOX_WEBHOOK_SECRET");

  assertSandboxUrl("SANDBOX_GATEWAY_URL", gatewayUrl);
  assertSandboxUrl("SANDBOX_LICENSING_URL", licensingUrl);

  const stamp = nowStamp();
  const outDir = path.join(process.cwd(), "artifacts", "security-drills", stamp);
  fs.mkdirSync(outDir, { recursive: true });

  const failures = [];
  const runId = `sandbox_drill_${Date.now()}`;

  // 1) Malformed payload checks
  const malformed1 = await fetch(`${licensingUrl}/api/licenses/issue`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${licensingApiToken}` },
    body: "{",
  });
  const malformed2 = await fetch(`${gatewayUrl}/api/licenses/claim/create`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{",
  });
  const malformedWebhookPayload = JSON.stringify({
    id: `${runId}_bad_sig`,
    type: "payment_intent.status.updated",
    data: { payment_intent_id: `${runId}_bad_sig_pi`, status: "completed" },
  });
  const malformed3 = await fetch(`${gatewayUrl}/api/webhooks/ziina`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-hmac-signature": "sha256=bad" },
    body: malformedWebhookPayload,
  });

  const malformedStatuses = [malformed1.status, malformed2.status, malformed3.status];
  const malformedPass = malformed1.status === 400 && malformed2.status === 400 && malformed3.status === 401;
  if (!malformedPass) failures.push(`Malformed drill failed: statuses=${malformedStatuses.join(",")}`);
  writeReport(outDir, "drill_results_malformed.txt", "Malformed Payload Drill", {
    pass: malformedPass,
    request_count: 3,
    status_distribution: statusDistribution(
      malformedStatuses.map((status) => ({
        status,
      }))
    ),
  });

  // 2) Replay protection checks
  const replayEventId = `${runId}_replay_evt`;
  const replayIntentId = `${runId}_replay_pi`;
  const replayPayload = JSON.stringify({
    id: replayEventId,
    type: "payment_intent.status.updated",
    data: { payment_intent_id: replayIntentId, status: "completed" },
  });
  const replaySig = crypto.createHmac("sha256", webhookSecret).update(replayPayload).digest("hex");
  const replayBefore = Number(
    psqlScalar(
      gatewayDbUrl,
      `select count(*) from webhook_events where provider='ZIINA' and provider_event_id=${sqlLit(replayEventId)}`
    )
  );

  const replayResp1 = await fetch(`${gatewayUrl}/api/webhooks/ziina`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hmac-signature": replaySig,
    },
    body: replayPayload,
  });
  const replayResp2 = await fetch(`${gatewayUrl}/api/webhooks/ziina`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hmac-signature": replaySig,
    },
    body: replayPayload,
  });
  const replayAfter = Number(
    psqlScalar(
      gatewayDbUrl,
      `select count(*) from webhook_events where provider='ZIINA' and provider_event_id=${sqlLit(replayEventId)}`
    )
  );
  const replayDelta = replayAfter - replayBefore;
  const replayPass = replayResp1.status === 200 && replayResp2.status === 200 && replayDelta === 1;
  if (!replayPass) {
    failures.push(`Replay drill failed: statuses=${replayResp1.status},${replayResp2.status} delta=${replayDelta}`);
  }
  writeReport(outDir, "drill_results_replay.txt", "Replay Protection Drill", {
    pass: replayPass,
    request_count: 2,
    status_distribution: statusDistribution([{ status: replayResp1.status }, { status: replayResp2.status }]),
    db_before: replayBefore,
    db_after: replayAfter,
    db_delta: replayDelta,
  });

  // 3) Concurrency issue flow (100 parallel)
  const concurrentIntent = `${runId}_issue_concurrency`;
  const concurrentInstall = "11111111-1111-4111-8111-111111111111";
  const issueResults = await parallelPost(
    `${licensingUrl}/api/entitlements/issue`,
    { "content-type": "application/json", authorization: `Bearer ${licensingApiToken}` },
    () => ({
      paymentIntentId: concurrentIntent,
      installToken: concurrentInstall,
      productSku: "DOCSMITH_SIF_PRO",
      plan: "PRO",
      customerEmail: "sandbox-concurrency@example.com",
    }),
    100
  );
  const issueStatusDist = statusDistribution(issueResults);
  const issueDbCount = Number(
    psqlScalar(licensingDbUrl, `select count(*) from licenses where payment_intent_id=${sqlLit(concurrentIntent)}`)
  );
  const issuePass = issueDbCount === 1 && Number(issueStatusDist["500"] || 0) === 0;
  if (!issuePass) {
    failures.push(`Concurrency issue drill failed: db_count=${issueDbCount} statuses=${JSON.stringify(issueStatusDist)}`);
  }
  writeReport(outDir, "drill_results_concurrency.txt", "Concurrency Drill", {
    pass: issuePass,
    request_count: 100,
    status_distribution: issueStatusDist,
    db_license_rows_for_intent: issueDbCount,
  });

  // Prepare claim record fixture for claim flood tests
  const claimIntent = `${runId}_claim_flow`;
  const deliveryToken = crypto.randomBytes(18).toString("base64url");
  const licenseKey = `DS-${crypto.randomBytes(2).toString("hex").toUpperCase()}-${crypto
    .randomBytes(2)
    .toString("hex")
    .toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
  const claimInstall = "22222222-2222-4222-8222-222222222222";
  psqlExec(
    gatewayDbUrl,
    `
    INSERT INTO payments (payment_intent_id, status, amount, currency, customer_email, product_sku, plan, employee_limit, delivery_token_hash)
    VALUES (
      ${sqlLit(claimIntent)},
      'PAID',
      14900,
      'AED',
      'sandbox-claim@example.com',
      'DOCSMITH_SIF_PRO',
      'PRO',
      3000,
      encode(digest(${sqlLit(deliveryToken)}, 'sha256'), 'hex')
    )
    ON CONFLICT (payment_intent_id) DO UPDATE
      SET status='PAID', delivery_token_hash=EXCLUDED.delivery_token_hash, plan='PRO', employee_limit=3000;
    `
  );
  psqlExec(
    gatewayDbUrl,
    `
    INSERT INTO license_deliveries (payment_intent_id, license_key, source, license_id, plan, issued_payload, expires_at)
    VALUES (
      ${sqlLit(claimIntent)},
      ${sqlLit(licenseKey)},
      'sandbox-drill',
      ${sqlLit(`lic_${runId}`)},
      'PRO',
      '{}'::jsonb,
      now() + interval '1 day'
    )
    ON CONFLICT (payment_intent_id) DO UPDATE
      SET license_key=EXCLUDED.license_key, plan=EXCLUDED.plan, issued_payload=EXCLUDED.issued_payload;
    `
  );

  const claimCreateResp = await fetch(`${gatewayUrl}/api/licenses/claim/create`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      paymentIntentId: claimIntent,
      deliveryToken,
    }),
  });
  const claimCreateBody = await claimCreateResp.text();
  let claimCode = "";
  try {
    const parsed = JSON.parse(claimCreateBody);
    claimCode = String(parsed.claimCode || "");
  } catch {
    // no-op
  }
  if (claimCreateResp.status !== 200 || !claimCode) {
    failures.push(`Claim setup failed: status=${claimCreateResp.status}`);
  }

  // 4) Rate-limit flood checks (+ mutation checks)
  const ratePrefix = `${runId}_rate_issue_`;
  const beforeRateRows = Number(
    psqlScalar(licensingDbUrl, `select count(*) from licenses where payment_intent_id like ${sqlLit(`${ratePrefix}%`)}`)
  );
  const rateIssueResults = await parallelPost(
    `${licensingUrl}/api/licenses/issue`,
    { "content-type": "application/json", authorization: `Bearer ${licensingApiToken}` },
    (i) => ({
      paymentIntentId: `${ratePrefix}${i}`,
      productSku: "DOCSMITH_SIF_PRO",
      plan: "PRO",
      customerEmail: `sandbox-rate-${i}@example.com`,
    }),
    80
  );
  const afterRateRows = Number(
    psqlScalar(licensingDbUrl, `select count(*) from licenses where payment_intent_id like ${sqlLit(`${ratePrefix}%`)}`)
  );
  const rateIssueDist = statusDistribution(rateIssueResults);
  const rateIssue429 = Number(rateIssueDist["429"] || 0);
  const rateIssueErr = Number(rateIssueDist.ERR || 0);
  const rateIssue2xx = Object.entries(rateIssueDist)
    .filter(([code]) => Number(code) >= 200 && Number(code) < 300)
    .reduce((acc, [, count]) => acc + Number(count), 0);
  const mutationDelta = afterRateRows - beforeRateRows;
  const issueRatePass =
    rateIssue429 > 0 && mutationDelta >= rateIssue2xx && mutationDelta <= rateIssue2xx + rateIssueErr;
  if (!issueRatePass) {
    failures.push(
      `Issue flood drill failed: 429=${rateIssue429} db_delta=${mutationDelta} success_2xx=${rateIssue2xx} err=${rateIssueErr}`
    );
  }

  const claimEventsBefore = Number(
    psqlScalar(
      gatewayDbUrl,
      `select count(*) from license_claim_events where payment_intent_id=${sqlLit(claimIntent)} and event_type='REDEEM_SUCCESS'`
    )
  );
  const claimFloodResults = await parallelPost(
    `${gatewayUrl}/api/internal/claims/consume`,
    { "content-type": "application/json", authorization: `Bearer ${paymentGatewayApiToken}` },
    () => ({
      claimCode,
      installId: claimInstall,
      extensionVersion: "sandbox-drill",
    }),
    80
  );
  const claimEventsAfter = Number(
    psqlScalar(
      gatewayDbUrl,
      `select count(*) from license_claim_events where payment_intent_id=${sqlLit(claimIntent)} and event_type='REDEEM_SUCCESS'`
    )
  );
  const claimFloodDist = statusDistribution(claimFloodResults);
  const claimFlood429 = Number(claimFloodDist["429"] || 0);
  const claimRedeemedRows = Number(
    psqlScalar(
      gatewayDbUrl,
      `select count(*) from license_claims where payment_intent_id=${sqlLit(claimIntent)} and status='REDEEMED'`
    )
  );
  const claimRatePass = claimFlood429 > 0 && claimEventsAfter === 1 && claimRedeemedRows === 1;
  if (!claimRatePass) {
    failures.push(
      `Claim flood drill failed: 429=${claimFlood429} redeem_success_events=${claimEventsAfter} redeemed_rows=${claimRedeemedRows}`
    );
  }

  writeReport(outDir, "drill_results_rate_limit.txt", "Rate Limit Flood Drill", {
    pass: issueRatePass && claimRatePass,
    request_count: 160,
    issue_status_distribution: rateIssueDist,
    claim_status_distribution: claimFloodDist,
    issue_429_count: rateIssue429,
    issue_err_count: rateIssueErr,
    claim_429_count: claimFlood429,
    issue_db_rows_before: beforeRateRows,
    issue_db_rows_after: afterRateRows,
    issue_db_mutation_delta: mutationDelta,
    issue_success_2xx_count: rateIssue2xx,
    claim_redeem_success_events_before: claimEventsBefore,
    claim_redeem_success_events_after: claimEventsAfter,
    claim_redeemed_rows: claimRedeemedRows,
  });

  const summaryPath = path.join(outDir, "final_security_sweep_summary.md");
  const releaseStatus = failures.length === 0 ? "GREEN" : "RED";
  const summary = [
    "# Final Security Sweep Summary",
    `generated_at_utc: ${new Date().toISOString()}`,
    `gateway_url: ${gatewayUrl}`,
    `licensing_url: ${licensingUrl}`,
    `release_status: ${releaseStatus}`,
    "",
    "## Drill Files",
    `- drill_results_malformed.txt`,
    `- drill_results_replay.txt`,
    `- drill_results_concurrency.txt`,
    `- drill_results_rate_limit.txt`,
    "",
    "## Verdict",
    failures.length === 0 ? "- PASS: all sandbox drill gates satisfied." : "- FAIL:",
    ...failures.map((f) => `- ${f}`),
    "",
  ].join("\n");
  fs.writeFileSync(summaryPath, summary, "utf8");

  process.stdout.write(`${outDir}\n`);
  if (failures.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(String(error?.stack || error?.message || error));
  process.exit(1);
});
