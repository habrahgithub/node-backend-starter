import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

process.env.ARC_OPERATOR_USERNAME = "operator";
process.env.ARC_OPERATOR_PASSWORD = "operator-local-change-me";
process.env.ARC_SESSION_SECRET = "current-secret";
process.env.ARC_SESSION_PREVIOUS_SECRETS = "previous-secret";
process.env.ARC_ALLOW_DEFAULT_CREDENTIALS = "true";
process.env.ARC_AUTH_RATE_WINDOW_MS = "60000";
process.env.ARC_AUTH_MAX_ATTEMPTS = "2";
process.env.ARC_AUTH_BLOCK_SECONDS = "60";

const authService = await import("../server/services/authService.js");
const rateLimiter = await import("../server/services/authRateLimiter.js");

test("creates and verifies signed session token", () => {
  const token = authService.createSessionToken("operator");
  const result = authService.verifySessionToken(token);

  assert.equal(result.valid, true);
  assert.equal(result.payload.sub, "operator");
});

test("accepts token signed by previous session secret", () => {
  const payload = {
    sub: "operator",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", "previous-secret").update(encodedPayload).digest("base64url");
  const token = `${encodedPayload}.${signature}`;

  const result = authService.verifySessionToken(token);
  assert.equal(result.valid, true);
  assert.equal(result.payload.sub, "operator");
});

test("rate limiter blocks after max failed attempts", () => {
  const base = { ipAddress: "127.0.0.1", username: "operator" };

  rateLimiter.registerAuthAttempt({ ...base, success: false });
  const second = rateLimiter.registerAuthAttempt({ ...base, success: false });

  assert.equal(second.blocked, true);
  assert.ok(second.retryAfterSeconds > 0);
});
