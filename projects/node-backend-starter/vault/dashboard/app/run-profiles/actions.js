"use server";

import { headers } from "next/headers";
import { executeRunProfile, requestIpFromHeaders } from "../../lib/run-profiles";

export async function triggerRunProfileAction(payload) {
  const hdrs = headers();
  return executeRunProfile({
    profile: payload?.profile,
    rawProject: payload?.project,
    continueOnFail: Boolean(payload?.continueOnFail),
    requestIp: requestIpFromHeaders(hdrs)
  });
}
