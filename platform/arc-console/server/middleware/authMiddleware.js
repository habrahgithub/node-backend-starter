import { getSessionFromRequest } from "../services/authService.js";

const DASHBOARD_PUBLIC_PREFIXES = ["/login", "/_next", "/favicon.ico", "/robots.txt"];

function isDashboardPublicPath(pathname) {
  return DASHBOARD_PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function requireApiAuth(req, res, next) {
  const session = getSessionFromRequest(req);

  if (!session.authenticated) {
    return res.status(401).json({
      error: "unauthorized",
      message: "Authentication required.",
      reason: session.reason || "missing_session"
    });
  }

  req.arcSession = session;
  return next();
}

export function requireDashboardAuth(req, res, next) {
  if (isDashboardPublicPath(req.path)) {
    return next();
  }

  const session = getSessionFromRequest(req);
  if (!session.authenticated) {
    const nextPath = encodeURIComponent(req.originalUrl || req.url || "/");
    return res.redirect(302, `/login?next=${nextPath}`);
  }

  req.arcSession = session;
  return next();
}
