import crypto from "node:crypto";

const HEADER = "x-request-id";

export function requestIdMiddleware(req, res, next) {
  const incoming = req.get?.(HEADER) || req.headers?.[HEADER];

  const requestId =
    typeof incoming === "string" && incoming.trim().length > 0
      ? incoming.trim()
      : crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader(HEADER, requestId);

  next();
}
