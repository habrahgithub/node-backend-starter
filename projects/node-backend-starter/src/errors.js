export const errorResponse = (code, message, details) => {
  const payload = { ok: false, error: code, message };

  if (details !== undefined) {
    payload.details = details;
  }

  return payload;
};

export const notFound = () => errorResponse("NotFound", "Route not found");

export const internalServerError = () =>
  errorResponse("InternalServerError", "Unexpected server error");

export const validationError = (issues) =>
  errorResponse("ValidationError", "Request validation failed", issues);
