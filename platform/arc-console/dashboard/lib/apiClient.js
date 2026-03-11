export class ApiRequestError extends Error {
  constructor(route, status, message) {
    super(message || `Failed request: ${route} (${status})`);
    this.name = "ApiRequestError";
    this.route = route;
    this.status = status;
  }
}

export function resolveBaseUrl(context) {
  if (context?.req?.headers?.host) {
    const protoHeader = String(context.req.headers["x-forwarded-proto"] || "http");
    const protocol = protoHeader.split(",")[0].trim() || "http";
    return `${protocol}://${context.req.headers.host}`;
  }

  return process.env.ARC_CONSOLE_BASE_URL || "http://localhost:4015";
}

function buildHeaders(context, initHeaders = {}) {
  const headers = {
    ...initHeaders
  };

  if (context?.req?.headers?.cookie && !headers.cookie) {
    headers.cookie = context.req.headers.cookie;
  }

  return headers;
}

export async function fetchJson(context, route, init = {}) {
  const baseUrl = resolveBaseUrl(context);
  const response = await fetch(`${baseUrl}${route}`, {
    ...init,
    headers: buildHeaders(context, init.headers || {})
  });

  if (!response.ok) {
    let message = "";
    try {
      const payload = await response.json();
      message = payload?.message || "";
    } catch {
      // Non-JSON error payload.
    }

    throw new ApiRequestError(route, response.status, message);
  }

  return response.json();
}
