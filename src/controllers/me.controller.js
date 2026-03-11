export const me = (req, res) => {
  const user = req.user ?? {};
  const roles = Array.isArray(user.roles) ? user.roles : [];

  res.json({
    ok: true,
    user: {
      sub: user.sub,
      email: user.email,
      roles,
    },
  });
};
