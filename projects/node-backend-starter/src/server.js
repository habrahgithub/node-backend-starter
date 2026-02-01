import dotenv from "dotenv";
import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { logger } from "./utils/logger.js";

dotenv.config();

const { port } = loadEnv();

const app = createApp();

const server = app.listen(port, () => {
  logger.info("server.started", { port });
});

server.on("error", (err) => {
  logger.error("server.start_failed", { message: err?.message, stack: err?.stack });
  process.exit(1);
});

let isShuttingDown = false;

const shutdown = (signal, exitCode = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info("server.shutdown.start", { signal, exitCode });

  try {
    if (typeof server.closeIdleConnections === "function") {
      server.closeIdleConnections();
    }
    if (typeof server.closeAllConnections === "function") {
      server.closeAllConnections();
    }
  } catch {
    // ignore
  }

  server.close(() => {
    logger.info("server.shutdown.complete");
    process.exit(exitCode);
  });

  setTimeout(() => {
    logger.error("server.shutdown.force_exit");
    process.exit(1);
  }, 10_000).unref();
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", (err) => {
  logger.error("process.uncaught_exception", { message: err?.message, stack: err?.stack });
  shutdown("uncaughtException", 1);
});
process.on("unhandledRejection", (reason) => {
  logger.error("process.unhandled_rejection", { reason });
  shutdown("unhandledRejection", 1);
});
