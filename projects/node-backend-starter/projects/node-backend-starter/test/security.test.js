import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("security middleware", () => {
  const originalEnv = {
    RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  };

  beforeEach(() => {
    process.env.RATE_LIMIT_MAX = originalEnv.RATE_LIMIT_MAX;
    process.env.RATE_LIMIT_WINDOW_MS = originalEnv.RATE_LIMIT_WINDOW_MS;
  });

  afterEach(() => {
    process.env.RATE_LIMIT_MAX = originalEnv.RATE_LIMIT_MAX;
    process.env.RATE_LIMIT_WINDOW_MS = originalEnv.RATE_LIMIT_WINDOW_MS;
  });

  it("sets helmet headers", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("returns standardized 429 response when rate limit exceeded", async () => {
    process.env.RATE_LIMIT_MAX = "1";
    process.env.RATE_LIMIT_WINDOW_MS = "60000";
    const app = createApp();

    const first = await request(app).get("/api/v1/health");
    expect(first.status).toBe(200);

    const second = await request(app).get("/api/v1/health");
    expect(second.status).toBe(429);
    expect(second.body).toEqual({
      ok: false,
      error: "RateLimitExceeded",
      message: "Too many requests",
      details: [],
    });
  });
});
