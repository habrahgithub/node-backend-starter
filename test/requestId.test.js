import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("request id middleware", () => {
  it("auto generates x-request-id when missing", async () => {
    const app = createApp();

    const res = await request(app).post("/api/v1/echo").send({ message: "hello" }).expect(200);

    const rid = res.headers["x-request-id"];
    expect(typeof rid).toBe("string");
    expect(rid.length).toBeGreaterThan(0);
  });

  it("passes through provided x-request-id", async () => {
    const app = createApp();

    const res = await request(app)
      .post("/api/v1/echo")
      .set("x-request-id", "test-req-123")
      .send({ message: "hello" })
      .expect(200);

    expect(res.headers["x-request-id"]).toBe("test-req-123");
  });
});
