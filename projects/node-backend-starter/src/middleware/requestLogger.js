import { logger } from "../utils/logger.js";

export const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();

  logger.info("request.started", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
  });

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    logger.info("request.completed", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs),
    });
  });

  next();
};
