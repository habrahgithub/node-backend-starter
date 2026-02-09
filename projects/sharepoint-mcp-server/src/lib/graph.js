import fs from "node:fs";
import { ConfidentialClientApplication } from "@azure/msal-node";
import { HttpError, fetchWithRetry, readResponseBody } from "./http.js";

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "");
}

function joinUrl(baseUrl, path) {
  const base = normalizeBaseUrl(baseUrl);
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

function redactSecrets(value) {
  if (!value) return value;
  return "[redacted]";
}

export function createGraphClient({
  tenantId,
  clientId,
  clientSecret,
  certificateThumbprint,
  certificatePrivateKey,
  certificatePrivateKeyPath,
  certificateX5c,
  authorityHost = "https://login.microsoftonline.com",
  graphBaseUrl = "https://graph.microsoft.com/v1.0",
  scope = "https://graph.microsoft.com/.default",
}) {
  const state = {
    accessToken: null,
    accessTokenExpiresAtMs: 0,
    inFlightTokenPromise: null,
  };

  const authority = `${authorityHost.replace(/\/+$/, "")}/${tenantId}`;

  function resolvePrivateKey() {
    if (certificatePrivateKey?.trim()) return certificatePrivateKey;
    if (certificatePrivateKeyPath?.trim()) {
      return fs.readFileSync(certificatePrivateKeyPath, "utf8");
    }
    return "";
  }

  function createMsalClient() {
    if (!tenantId || !clientId) {
      throw new Error("Missing Microsoft auth env vars. Set SP_TENANT_ID and SP_CLIENT_ID.");
    }

    const privateKey = resolvePrivateKey();
    const hasCertificate = Boolean(certificateThumbprint && privateKey);

    if (hasCertificate) {
      return {
        client: new ConfidentialClientApplication({
          auth: {
            clientId,
            authority,
            clientCertificate: {
              thumbprint: certificateThumbprint,
              privateKey,
              ...(certificateX5c ? { x5c: certificateX5c } : {}),
            },
          },
        }),
        authMode: "certificate",
      };
    }

    if (clientSecret) {
      return {
        client: new ConfidentialClientApplication({
          auth: {
            clientId,
            authority,
            clientSecret,
          },
        }),
        authMode: "client-secret",
      };
    }

    throw new Error(
      "Missing app credentials. Prefer certificate auth (SP_CLIENT_CERT_THUMBPRINT + SP_CLIENT_CERT_PRIVATE_KEY[_PATH]); fallback is SP_CLIENT_SECRET."
    );
  }

  const msal = createMsalClient();

  async function getAccessToken() {
    const now = Date.now();
    if (state.accessToken && now < state.accessTokenExpiresAtMs - 30_000) {
      return state.accessToken;
    }

    if (state.inFlightTokenPromise) return state.inFlightTokenPromise;

    state.inFlightTokenPromise = (async () => {
      const tokenResult = await msal.client.acquireTokenByClientCredential({
        scopes: [scope],
      });
      const accessToken = tokenResult?.accessToken;
      if (!accessToken) {
        throw new Error("MSAL token acquisition returned no access token.");
      }

      state.accessToken = accessToken;
      state.accessTokenExpiresAtMs = tokenResult?.expiresOn?.getTime() ?? Date.now() + 5 * 60_000;
      return accessToken;
    })().finally(() => {
      state.inFlightTokenPromise = null;
    });

    return state.inFlightTokenPromise;
  }

  async function request(path, { method = "GET", query, headers, body } = {}) {
    const token = await getAccessToken();

    const url = new URL(joinUrl(graphBaseUrl, path));
    if (query && typeof query === "object") {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null || value === "") continue;
        url.searchParams.set(key, String(value));
      }
    }

    const response = await fetchWithRetry(url.toString(), {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(body ? { "content-type": "application/json" } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseBody = await readResponseBody(response);
    if (!response.ok) {
      throw new HttpError("Graph request failed", {
        status: response.status,
        url: url.toString(),
        body: responseBody,
      });
    }
    return responseBody;
  }

  async function requestRaw(path, { method = "GET", query, headers, body } = {}) {
    const token = await getAccessToken();
    const url = new URL(joinUrl(graphBaseUrl, path));
    if (query && typeof query === "object") {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null || value === "") continue;
        url.searchParams.set(key, String(value));
      }
    }

    return fetchWithRetry(url.toString(), {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...headers,
      },
      body,
    });
  }

  function getConfigSummary() {
    return {
      tenantId: tenantId || null,
      clientId: clientId || null,
      authMode: msal.authMode,
      clientSecret: clientSecret ? redactSecrets(clientSecret) : null,
      certificateThumbprint: certificateThumbprint || null,
      certificatePrivateKey: resolvePrivateKey() ? "[redacted]" : null,
      authorityHost,
      graphBaseUrl,
      scope,
    };
  }

  return {
    request,
    requestRaw,
    getConfigSummary,
  };
}
