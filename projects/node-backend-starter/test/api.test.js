import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("API v1", () => {
  it("GET /api/v1/health returns ok", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.service).toBe("node-backend-starter");
    expect(typeof res.body.time).toBe("string");
  });

  it("POST /api/v1/echo returns message when valid", async () => {
    const app = createApp();
    const res = await request(app).post("/api/v1/echo").send({ message: "hello" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, message: "hello" });
  });

  it("POST /api/v1/echo returns 400 when invalid", async () => {
    const app = createApp();
    const res = await request(app).post("/api/v1/echo").send({ message: "" });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe("ValidationError");
    expect(Array.isArray(res.body.details)).toBe(true);
  });
});
