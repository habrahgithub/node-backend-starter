import express from "express";
import swaggerUi from "swagger-ui-express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { openapiSpec } from "./openapi.js";
import routes from "./routes/index.js";
import { notFound, internalServerError } from "./errors.js";
import { requestIdMiddleware } from "./middleware/requestId.middleware.js";

export const createApp = () => {
  const app = express();
  app.use(requestIdMiddleware);

  app.use(express.json());

  app.use((req, res, next) => {
    console.log(`[${req.requestId}] ${req.method} ${req.url}`);
    next();
  });

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false
    })
  );

  // Rate limit API only (docs stay accessible)
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false
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
