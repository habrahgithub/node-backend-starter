import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { logger } from "../src/utils/logger.js";

describe("logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits structured JSON logs", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("test.message", { foo: "bar" });
    expect(spy).toHaveBeenCalled();
    const payload = JSON.parse(spy.mock.calls[0][0]);
    expect(payload.level).toBe("info");
    expect(payload.msg).toBe("test.message");
    expect(payload.foo).toBe("bar");
    expect(typeof payload.time).toBe("string");
  });

  it("logs request lifecycle events", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const app = createApp();
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);

    const messages = spy.mock.calls
      .map((call) => {
        try {
          return JSON.parse(call[0]);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .map((payload) => payload.msg);

    expect(messages).toContain("request.started");
    expect(messages).toContain("request.completed");
  });
});
