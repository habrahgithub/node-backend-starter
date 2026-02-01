export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    return res.status(400).json({
      ok: false,
      error: "ValidationError",
      details: result.error.issues,
    });
  }

  req.validated = result.data;
  next();
};
