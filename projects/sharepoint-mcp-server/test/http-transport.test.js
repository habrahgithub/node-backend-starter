import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = address && typeof address === "object" ? address.port : null;
      if (!port) {
        probe.close(() => reject(new Error("Failed to acquire a free TCP port.")));
        return;
      }
      probe.close((error) => {
        if (error) return reject(error);
        resolve(port);
      });
    });
    probe.on("error", reject);
  });
}

async function startHttpServer({ routePath = "/mcp" } = {}) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "docsmith-mcp-http-test-"));
  const allowlistPath = path.join(tempDir, "allowlist.json");
  await writeFile(
    allowlistPath,
    JSON.stringify(
      {
        siteId: "site-id",
        lists: {
          "Execution Inbox": "list-execution",
          "Work Orders": "list-work-orders",
          "Decision Log": "list-decision-log",
          "Risk Register": "list-risk-register",
          "Release Log": "list-release-log",
          "MCP Audit Log": "list-audit-log",
        },
        libraries: {
          "Governance Docs": { driveId: "drive-governance-docs" },
        },
      },
      null,
      2
    ),
    "utf8"
  );

  const port = await getFreePort();
  const env = {
    ...process.env,
    SP_TENANT_ID: "tenant",
    SP_CLIENT_ID: "client-id",
    SP_CLIENT_SECRET: "client-secret",
    SWD_ALLOWLIST_PATH: allowlistPath,
    MCP_DISABLED: "0",
    SWD_PHASE_MODE: "read_only",
    SWD_ENABLE_WRITES: "false",
    MCP_TRANSPORT: "http",
    MCP_HTTP_HOST: "127.0.0.1",
    MCP_HTTP_PORT: String(port),
    MCP_HTTP_PATH: routePath,
  };

  const child = spawn(process.execPath, ["src/index.js"], {
    cwd: projectRoot,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  const ready = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out waiting for HTTP startup log. stderr:\n${stderr}`));
    }, 10_000);

    const onStderr = (chunk) => {
      stderr += chunk.toString("utf8");
      if (stderr.includes("running on streamable HTTP")) {
        clearTimeout(timeout);
        child.stderr.off("data", onStderr);
        resolve();
      }
    };

    child.stderr.on("data", onStderr);
    child.once("exit", (code, signal) => {
      clearTimeout(timeout);
      reject(
        new Error(
          `HTTP server exited before ready (code=${code}, signal=${signal}). stderr:\n${stderr}`
        )
      );
    });
  });

  await ready;

  async function stop() {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");
      await Promise.race([
        once(child, "exit"),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
      if (child.exitCode === null && child.signalCode === null) {
        child.kill("SIGKILL");
        await once(child, "exit");
      }
    }
    await rm(tempDir, { recursive: true, force: true });
  }

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    stop,
  };
}

async function withServer(fn, options) {
  const runtime = await startHttpServer(options);
  try {
    await fn(runtime);
  } finally {
    await runtime.stop();
  }
}

test("returns 404 for a path that does not match MCP_HTTP_PATH", async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/not-mcp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error.code, "NOT_FOUND");
  });
});

test("returns 405 for unsupported methods on MCP path", async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/mcp`, { method: "GET" });
    const body = await response.json();

    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "POST");
    assert.equal(body.error.code, "METHOD_NOT_ALLOWED");
  });
});

test("returns 415 when POST content-type is not application/json", async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "{}",
    });
    const body = await response.json();

    assert.equal(response.status, 415);
    assert.equal(body.error.code, "UNSUPPORTED_MEDIA_TYPE");
  });
});

test("returns 400 when POST body is not valid JSON", async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{invalid-json}",
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, "BAD_JSON");
  });
});
