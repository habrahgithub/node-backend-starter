import {
  areDefaultCredentialsInUse,
  clearSessionCookie,
  createSessionToken,
  getSessionFromRequest,
  isLoginValid,
  setSessionCookie
} from "../services/authService.js";
import { env } from "../config/env.js";
import { getRateLimitState, registerAuthAttempt } from "../services/authRateLimiter.js";
import { recordAuditEvent } from "../services/observability.js";

export function login(req, res) {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");
  const ipAddress = String(req.ip || req.socket?.remoteAddress || "unknown");

  const rateState = getRateLimitState({ ipAddress, username });
  if (rateState.blocked) {
    recordAuditEvent({
      action: "login",
      outcome: "rate_limited",
      actor: username || "unknown",
      ipAddress,
      details: `retry_after=${rateState.retryAfterSeconds}s`
    });

    return res.status(429).json({
      error: "too_many_attempts",
      message: "Too many failed login attempts. Try again later.",
      retryAfterSeconds: rateState.retryAfterSeconds
    });
  }

  if (!isLoginValid({ username, password })) {
    const failed = registerAuthAttempt({ ipAddress, username, success: false });

    recordAuditEvent({
      action: "login",
      outcome: "failed",
      actor: username || "unknown",
      ipAddress,
      details: `failed_attempts=${failed.failedAttempts}`
    });

    return res.status(401).json({
      error: "invalid_credentials",
      message:
        areDefaultCredentialsInUse() && !env.allowDefaultCredentials
          ? "Default credentials are disabled. Set ARC_OPERATOR_* and ARC_SESSION_SECRET."
          : "Invalid operator credentials."
    });
  }

  registerAuthAttempt({ ipAddress, username, success: true });
  const token = createSessionToken(username);
  setSessionCookie(res, token);

  recordAuditEvent({
    action: "login",
    outcome: "success",
    actor: username,
    ipAddress
  });

  return res.json({
    authenticated: true,
    username
  });
}

export function session(req, res) {
  const details = getSessionFromRequest(req);
  if (!details.authenticated) {
    recordAuditEvent({
      action: "session",
      outcome: "missing",
      actor: "unknown",
      ipAddress: String(req.ip || req.socket?.remoteAddress || "unknown")
    });

    return res.status(401).json({
      authenticated: false,
      reason: details.reason || "missing_session"
    });
  }

  return res.json({
    authenticated: true,
    username: details.username,
    expiresAt: details.expiresAt,
    issuedAt: details.issuedAt
  });
}

export function logout(_req, res) {
  recordAuditEvent({
    action: "logout",
    outcome: "success",
    actor: _req.arcSession?.username || "unknown",
    ipAddress: String(_req.ip || _req.socket?.remoteAddress || "unknown")
  });

  clearSessionCookie(res);
  return res.json({
    authenticated: false
  });
}
