import crypto from "crypto";

export const requestId = (req, res, next) => {
  const incoming = req.header("x-request-id");
  const id = incoming && incoming.trim() ? incoming.trim() : crypto.randomUUID();

  req.requestId = id;
  res.setHeader("x-request-id", id);

  next();
};
