import {
  executeRunProfile,
  requestIpFromHeaders,
  requestIsLocal,
  tokenMatches
} from "../../../lib/run-profiles";

export const runtime = "nodejs";

export async function POST(request) {
  if (!requestIsLocal(request.headers.get("host"))) {
    return Response.json({ ok: false, error: "run_profiles_local_only" }, { status: 403 });
  }

  const expectedToken = String(process.env.VAULT_RUN_TOKEN || "").trim();
  const providedToken = request.headers.get("x-vault-run-token");
  if (!tokenMatches(expectedToken, providedToken)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const result = await executeRunProfile({
    profile: body?.profile,
    rawProject: body?.project,
    continueOnFail: Boolean(body?.continueOnFail),
    requestIp: requestIpFromHeaders(request.headers)
  });
  const status = result?.error ? 400 : 200;
  return Response.json(result, { status });
}
