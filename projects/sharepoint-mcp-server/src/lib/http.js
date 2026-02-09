export class HttpError extends Error {
  constructor(message, { status, url, body } = {}) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.url = url;
    this.body = body;
  }
}

export async function readResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  try {
    return await response.text();
  } catch {
    return null;
  }
}

export async function fetchWithRetry(url, init, { retries = 3 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, init);
      if (response.status !== 429 && response.status < 500) return response;
      const retryAfter = response.headers.get("retry-after");
      const waitSeconds = retryAfter ? Number(retryAfter) : NaN;
      if (attempt >= retries) return response;
      const delayMs = Number.isFinite(waitSeconds)
        ? waitSeconds * 1000
        : 250 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delayMs));
      continue;
    } catch (error) {
      lastError = error;
      if (attempt >= retries) throw error;
      await new Promise((r) => setTimeout(r, 250 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

