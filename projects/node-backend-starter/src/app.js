import express from "express";
import swaggerUi from "swagger-ui-express";
import { openapiSpec } from "./openapi.js";
import routes from "./routes/index.js";
import { notFound, internalServerError } from "./errors.js";
import { requestId } from "./middleware/requestId.js";

export const createApp = () => {
  const app = express();
  app.use(express.json());

  app.use(requestId);

  app.use((req, res, next) => {
    console.log(`[${req.requestId}] ${req.method} ${req.url}`);
    next();
  });

  app.get("/openapi.json", (req, res) => {
    res.json(openapiSpec);
  });

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

  app.use("/api/v1", routes);

  app.use((req, res) => {
    res.status(404).json(notFound());
  });

  app.use((err, req, res, _next) => {
    console.error(`[${req.requestId}]`, err);
    res.status(500).json(internalServerError());
  });

  return app;
};
