import express from "express";
import dotenv from "dotenv";
import routes from "./routes/index.js";

dotenv.config();

const app = express();
app.use(express.json());

/* =========================
   Request logging
========================= */
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

/* =========================
   Routes
========================= */
app.use("/api/v1", routes);

/* =========================
   404 handler
========================= */
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: "Not Found",
  });
});

/* =========================
   Error handler
========================= */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    ok: false,
    error: "Internal Server Error",
  });
});

/* =========================
   Server start
========================= */
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

/* =========================
   Graceful shutdown (SAFE)
========================= */
let isShuttingDown = false;

const shutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`Received ${signal}. Shutting down...`);

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
    console.log("HTTP server closed.");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Force exiting after timeout.");
    process.exit(1);
  }, 10_000).unref();
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
