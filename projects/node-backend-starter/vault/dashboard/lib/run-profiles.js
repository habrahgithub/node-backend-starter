import { timingSafeEqual } from "node:crypto";
import { spawn } from "node:child_process";
import path from "node:path";
import { getRunProfilesMeta } from "./db";

function runCommand(command, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("close", (code) => {
      resolve({
        exitCode: Number(code ?? 1),
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });
  });
}

function pickSummaryLine(stdout, stderr) {
  const lines = `${stdout}\n${stderr}`
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const summary = lines.find((line) => line.startsWith("Run profile "));
  if (summary) return summary;
  return lines[lines.length - 1] || "No output";
}

function pickSummaryEventId(stdout) {
  const match = stdout.match(/RunSummaryEventId=(\d+)/);
  return match ? Number(match[1]) : null;
}

function pickRunGroupId(stdout) {
  const explicit = stdout.match(/RunGroupId=([A-Za-z0-9-]+)/);
  if (explicit) return explicit[1];
  const match = stdout.match(/runall-[0-9TZ]+-[a-f0-9]+/);
  return match ? match[0] : null;
}

function getWorkspaceRoot() {
  return path.resolve(process.cwd(), "..", "..");
}

async function appendDashboardTriggerNote({
  workspaceRoot,
  project,
  profile,
  continueOnFail,
  mode,
  requestIp
}) {
  const swdVaultCmd = path.resolve(workspaceRoot, "swd-vault");
  const noteDetails = JSON.stringify({
    profile,
    mode,
    request_ip: requestIp || "local",
    continue_on_fail: Boolean(continueOnFail)
  });
  await runCommand(
    swdVaultCmd,
    [
      "append",
      "--type",
      "note",
      "--project",
      project || "swd-os",
      "--severity",
      "info",
      "--summary",
      "Run profile triggered from War Room",
      "--details",
      noteDetails,
      "--source",
      "dashboard"
    ],
    workspaceRoot
  );
}

function normalizeProject(rawProject) {
  const project = String(rawProject || "").trim();
  return project && project !== "__all__" ? project : "";
}

export async function executeRunProfile({
  profile,
  rawProject,
  continueOnFail = false,
  requestIp = "local"
}) {
  const cleanProfile = String(profile || "").trim();
  if (!cleanProfile) return { ok: false, error: "profile_required" };

  const project = normalizeProject(rawProject);
  const meta = getRunProfilesMeta();
  if (meta.repos.length === 0) return { ok: false, error: "no_repos_configured" };
  if (!meta.profiles.includes(cleanProfile)) return { ok: false, error: "profile_not_configured" };

  const selectedRepos = project ? meta.repos.filter((repo) => repo.name === project) : meta.repos;
  if (selectedRepos.length === 0) return { ok: false, error: "project_not_found" };

  const missingProfiles = selectedRepos.filter((repo) => !repo.profiles.includes(cleanProfile)).map((repo) => repo.name);
  const workspaceRoot = getWorkspaceRoot();
  const swdVaultCmd = path.resolve(workspaceRoot, "swd-vault");

  await appendDashboardTriggerNote({
    workspaceRoot,
    project,
    profile: cleanProfile,
    continueOnFail,
    mode: project ? "project" : "all",
    requestIp
  });

  const args = ["run"];
  if (project) {
    args.push("--project", project);
  } else {
    args.push("--all");
  }
  args.push("--profile", cleanProfile);
  if (continueOnFail) args.push("--continue-on-fail");

  const { exitCode, stdout, stderr } = await runCommand(swdVaultCmd, args, workspaceRoot);
  const summary = pickSummaryLine(stdout, stderr);
  const summaryEventId = pickSummaryEventId(stdout);
  const runGroupId = pickRunGroupId(stdout);

  return {
    ok: exitCode === 0,
    exitCode,
    profile: cleanProfile,
    project: project || "__all__",
    continueOnFail: Boolean(continueOnFail),
    summary,
    summaryEventId,
    runGroupId,
    missingProfiles,
    stdout,
    stderr
  };
}

export function requestIsLocal(hostHeader) {
  const host = String(hostHeader || "");
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

export function requestIpFromHeaders(headersObj) {
  const forwardedFor = headersObj?.get?.("x-forwarded-for") || "";
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headersObj?.get?.("x-real-ip") || "local";
}

export function tokenMatches(expected, provided) {
  const expectedToken = String(expected || "");
  const providedToken = String(provided || "");
  if (!expectedToken) return true;
  if (!providedToken) return false;
  const expectedBuf = Buffer.from(expectedToken);
  const providedBuf = Buffer.from(providedToken);
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}
