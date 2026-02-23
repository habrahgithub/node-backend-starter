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
it("GET /openapi.json returns spec", async () => {
  const app = createApp();
  const res = await request(app).get("/openapi.json");
  expect(res.status).toBe(200);
  expect(res.body.openapi).toBe("3.0.3");
});

it("unknown route returns standardized 404", async () => {
  const app = createApp();
  const res = await request(app).get("/does-not-exist");
  expect(res.status).toBe(404);
  expect(res.body.ok).toBe(false);
  expect(res.body.error).toBe("NotFound");
  expect(typeof res.body.message).toBe("string");
});

it("validation error includes message", async () => {
  const app = createApp();
  const res = await request(app).post("/api/v1/echo").send({ message: "" });
  expect(res.status).toBe(400);
  expect(res.body.ok).toBe(false);
  expect(res.body.error).toBe("ValidationError");
  expect(typeof res.body.message).toBe("string");
  expect(Array.isArray(res.body.details)).toBe(true);
});

it("adds x-request-id when missing", async () => {
  const app = createApp();
  const res = await request(app).get("/api/v1/health");
  expect(res.status).toBe(200);
  expect(typeof res.headers["x-request-id"]).toBe("string");
  expect(res.headers["x-request-id"].length).toBeGreaterThan(0);
});

it("echoes back provided x-request-id", async () => {
  const app = createApp();
  const res = await request(app).get("/api/v1/health").set("x-request-id", "habib-test-123");
  expect(res.status).toBe(200);
  expect(res.headers["x-request-id"]).toBe("habib-test-123");
});
