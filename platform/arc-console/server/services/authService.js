import crypto from "crypto";
import { env } from "../config/env.js";

const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 12;
const SESSION_COOKIE_NAME = "arc_console_session";
const DEFAULT_OPERATOR_USERNAME = "operator";
const DEFAULT_OPERATOR_PASSWORD = "operator-local-change-me";
const DEFAULT_SESSION_SECRET = "arc-console-local-session-secret-change-me";

function getSessionSecret() {
  return env.sessionSecret;
}

function getSessionVerificationSecrets() {
  return [env.sessionSecret, ...env.previousSessionSecrets].filter(Boolean);
}

export function areDefaultCredentialsInUse() {
  return (
    env.operatorUsername === DEFAULT_OPERATOR_USERNAME &&
    env.operatorPassword === DEFAULT_OPERATOR_PASSWORD &&
    env.sessionSecret === DEFAULT_SESSION_SECRET
  );
}

function timingSafeEqual(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}

function base64Url(input) {
  return Buffer.from(input).toString("base64url");
}

function decodeBase64Url(input) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signPayload(encodedPayload) {
  return crypto.createHmac("sha256", getSessionSecret()).update(encodedPayload).digest("base64url");
}

export function parseCookies(cookieHeader) {
  const cookies = {};
  const raw = String(cookieHeader || "");

  raw.split(";").forEach((pair) => {
    const [name, ...rest] = pair.trim().split("=");
    if (!name) {
      return;
    }
    cookies[name] = decodeURIComponent(rest.join("="));
  });

  return cookies;
}

export function createSessionToken(username) {
  const ttlSeconds = env.sessionTtlSeconds || DEFAULT_SESSION_TTL_SECONDS;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = {
    sub: username,
    iat: nowSeconds,
    exp: nowSeconds + ttlSeconds
  };

  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false, reason: "missing_token" };
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return { valid: false, reason: "invalid_token_format" };
  }

  const verificationSecrets = getSessionVerificationSecrets();
  const hasMatchingSignature = verificationSecrets.some((secret) => {
    const expectedSignature = crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
    return timingSafeEqual(signature, expectedSignature);
  });

  if (!hasMatchingSignature) {
    return { valid: false, reason: "invalid_signature" };
  }

  let payload;
  try {
    payload = JSON.parse(decodeBase64Url(encodedPayload));
  } catch {
    return { valid: false, reason: "invalid_payload" };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!payload.exp || nowSeconds >= Number(payload.exp)) {
    return { valid: false, reason: "expired" };
  }

  return {
    valid: true,
    payload
  };
}

export function getSessionFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];
  const check = verifySessionToken(token);

  if (!check.valid) {
    return {
      authenticated: false,
      reason: check.reason
    };
  }

  return {
    authenticated: true,
    username: check.payload.sub,
    expiresAt: check.payload.exp,
    issuedAt: check.payload.iat
  };
}

export function isLoginValid({ username, password }) {
  const expectedUser = env.operatorUsername;
  const expectedPassword = env.operatorPassword;

  if (areDefaultCredentialsInUse() && !env.allowDefaultCredentials) {
    return false;
  }

  return timingSafeEqual(username, expectedUser) && timingSafeEqual(password, expectedPassword);
}

export function setSessionCookie(res, token) {
  const ttlSeconds = env.sessionTtlSeconds || DEFAULT_SESSION_TTL_SECONDS;
  const secure = env.environment === "production";
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    `Max-Age=${ttlSeconds}`,
    "HttpOnly",
    "SameSite=Lax"
  ];

  if (secure) {
    parts.push("Secure");
  }

  res.setHeader("Set-Cookie", parts.join("; "));
}

export function clearSessionCookie(res) {
  const secure = env.environment === "production";
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax"
  ];

  if (secure) {
    parts.push("Secure");
  }

  res.setHeader("Set-Cookie", parts.join("; "));
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}
