import { env } from "../config/env.js";

const attemptsByKey = new Map();

function getBucket(key) {
  const now = Date.now();
  const current = attemptsByKey.get(key);

  if (!current) {
    const next = {
      failedAttempts: 0,
      firstAttemptAt: now,
      blockedUntil: 0
    };
    attemptsByKey.set(key, next);
    return next;
  }

  if (now - current.firstAttemptAt > env.authRateWindowMs) {
    current.failedAttempts = 0;
    current.firstAttemptAt = now;
    current.blockedUntil = 0;
  }

  return current;
}

export function getRateLimitState({ ipAddress, username }) {
  const key = `${ipAddress || "unknown"}:${username || "unknown"}`;
  const bucket = getBucket(key);
  const now = Date.now();

  return {
    key,
    blocked: bucket.blockedUntil > now,
    retryAfterSeconds: bucket.blockedUntil > now ? Math.ceil((bucket.blockedUntil - now) / 1000) : 0,
    failedAttempts: bucket.failedAttempts
  };
}

export function registerAuthAttempt({ ipAddress, username, success }) {
  const key = `${ipAddress || "unknown"}:${username || "unknown"}`;
  const bucket = getBucket(key);
  const now = Date.now();

  if (success) {
    bucket.failedAttempts = 0;
    bucket.firstAttemptAt = now;
    bucket.blockedUntil = 0;

    return {
      blocked: false,
      retryAfterSeconds: 0,
      failedAttempts: 0
    };
  }

  bucket.failedAttempts += 1;

  if (bucket.failedAttempts >= env.authMaxAttempts) {
    bucket.blockedUntil = now + env.authBlockSeconds * 1000;
  }

  return {
    blocked: bucket.blockedUntil > now,
    retryAfterSeconds: bucket.blockedUntil > now ? Math.ceil((bucket.blockedUntil - now) / 1000) : 0,
    failedAttempts: bucket.failedAttempts
  };
}
