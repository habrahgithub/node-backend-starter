import jwt from "jsonwebtoken";
import { errorResponse } from "../errors.js";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.get?.("authorization") || req.headers?.authorization;

  if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json(errorResponse("Unauthorized", "Unauthorized", []));
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).json(errorResponse("Unauthorized", "Unauthorized", []));
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res
      .status(500)
      .json(errorResponse("InternalServerError", "JWT secret is not configured", []));
  }

  try {
    const payload = jwt.verify(token, secret);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json(errorResponse("Unauthorized", "Unauthorized", []));
  }
};
