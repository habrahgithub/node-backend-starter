import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";

describe("auth middleware", () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it("returns 401 when token is missing", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/me");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      ok: false,
      error: "Unauthorized",
      message: "Unauthorized",
      details: [],
    });
  });

  it("returns 401 when token is invalid", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/me").set("Authorization", "Bearer abc");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("returns user payload when token is valid", async () => {
    const token = jwt.sign(
      { sub: "user-123", email: "user@example.com", roles: ["admin"] },
      process.env.JWT_SECRET
    );
    const app = createApp();
    const res = await request(app).get("/api/v1/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.user).toEqual({
      sub: "user-123",
      email: "user@example.com",
      roles: ["admin"],
    });
  });
});
