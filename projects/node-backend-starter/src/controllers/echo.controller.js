export const echo = (req, res) => {
  const { message } = req.validated.body;

  res.status(200).json({
    ok: true,
    message
  });
};
