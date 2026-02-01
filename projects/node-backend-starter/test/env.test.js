import { describe, it, expect } from "vitest";
import { validateEnv } from "../src/config/env.js";

describe("env validation", () => {
  it("accepts default config when optional vars are missing", () => {
    const result = validateEnv({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.port).toBe(3000);
      expect(result.data.nodeEnv).toBe("development");
    }
  });

  it("rejects invalid port", () => {
    const result = validateEnv({ PORT: "99999" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe("PORT");
    }
  });

  it("requires JWT_SECRET in production", () => {
    const result = validateEnv({ NODE_ENV: "production" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe("JWT_SECRET");
    }
  });
});
