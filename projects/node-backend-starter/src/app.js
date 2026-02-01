import express from "express";
import routes from "./routes/index.js";

export const createApp = () => {
  const app = express();
  app.use(express.json());

  // request logging
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // routes
  app.use("/api/v1", routes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ ok: false, error: "Not Found" });
  });

  // error handler
  app.use((err, req, res, _next) => {
    console.error(err);
    res.status(500).json({ ok: false, error: "Internal Server Error" });
  });

  return app;
};
