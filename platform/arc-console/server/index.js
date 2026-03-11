import crypto from "crypto";
import cors from "cors";
import express from "express";
import next from "next";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import { requireDashboardAuth } from "./middleware/authMiddleware.js";
import { createRouter } from "./routes/index.js";
import { areDefaultCredentialsInUse } from "./services/authService.js";
import { recordErrorEvent, recordRequestEvent, recordWarningEvent } from "./services/observability.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dashboardDir = path.resolve(__dirname, "../dashboard");

async function bootstrap() {
  const app = express();
  const isDev = env.environment !== "production";

  app.use(cors());
  app.use(express.json());

  if (areDefaultCredentialsInUse()) {
    recordWarningEvent({
      source: "auth",
      code: "default_credentials_active",
      message: env.allowDefaultCredentials
        ? "Default credentials are active in this environment."
        : "Default credentials detected but disallowed."
    });
  }

  app.use((req, res, nextFn) => {
    const requestId = crypto.randomUUID();
    const start = process.hrtime.bigint();

    req.arcRequestId = requestId;
    res.setHeader("x-request-id", requestId);

    res.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

      recordRequestEvent({
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs,
        authenticated: Boolean(req.arcSession?.authenticated)
      });
    });

    nextFn();
  });

  app.use(createRouter());

  app.get("/api", (_req, res) => {
    res.json({
      name: env.consoleName,
      environment: env.environment,
      status: "online",
      unifiedServer: true,
      authRequired: true,
      apiBase: "/api"
    });
  });

  if (env.serveDashboard) {
    const dashboard = next({ dev: isDev, dir: dashboardDir });
    await dashboard.prepare();
    const handle = dashboard.getRequestHandler();

    app.all("*", (req, res, nextFn) => {
      if (req.path.startsWith("/api/")) {
        return nextFn();
      }

      return requireDashboardAuth(req, res, () => handle(req, res));
    });
  }

  app.use((error, req, res, _nextFn) => {
    recordErrorEvent({
      source: "server",
      message: error.message || "Unhandled server error",
      requestId: req.arcRequestId,
      path: req.path,
      details: error.stack
    });

    if (res.headersSent) {
      return;
    }

    res.status(500).json({
      error: "internal_server_error",
      message: "Unhandled server error.",
      requestId: req.arcRequestId
    });
  });

  const server = app.listen(env.port, env.host, () => {
    const mode = env.serveDashboard ? "API + dashboard" : "API only";
    console.log(`${env.consoleName} unified server listening on ${env.host}:${env.port} (${mode})`);
  });

  server.on("error", (error) => {
    recordErrorEvent({
      source: "server",
      message: "ARC Control Console unified server failed",
      details: error.message
    });

    console.error("ARC Control Console unified server failed", error);
  });
}

bootstrap().catch((error) => {
  recordErrorEvent({
    source: "bootstrap",
    message: "Failed to start ARC Control Console unified server",
    details: error.message
  });

  console.error("Failed to start ARC Control Console unified server", error);
  process.exit(1);
});
