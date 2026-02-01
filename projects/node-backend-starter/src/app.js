import express from "express";
import swaggerUi from "swagger-ui-express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { openapiSpec } from "./openapi.js";
import routes from "./routes/index.js";
import { notFound, internalServerError, rateLimitExceeded } from "./errors.js";
import { requestIdMiddleware } from "./middleware/requestId.middleware.js";

const getRateLimitConfig = () => {
  const windowMsRaw = Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10);
  const maxRaw = Number.parseInt(process.env.RATE_LIMIT_MAX, 10);

  return {
    windowMs: Number.isFinite(windowMsRaw) && windowMsRaw > 0 ? windowMsRaw : 15 * 60 * 1000,
    max: Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : 300,
  };
};

export const createApp = () => {
  const app = express();
  app.use(requestIdMiddleware);
  app.use(helmet());

  app.use(express.json());

  app.use((req, res, next) => {
    console.log(`[${req.requestId}] ${req.method} ${req.url}`);
    next();
  });

  // Rate limit API only (docs stay accessible)
  const { windowMs, max } = getRateLimitConfig();
  const apiLimiter = rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json(rateLimitExceeded());
    },
  });

  app.get("/openapi.json", (req, res) => {
    res.json(openapiSpec);
  });

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

  app.use("/api/v1", apiLimiter, routes);

  app.use((req, res) => {
    res.status(404).json(notFound());
  });

  app.use((err, req, res, _next) => {
    console.error(`[${req.requestId}]`, err);
    res.status(500).json(internalServerError());
  });

  return app;
};
