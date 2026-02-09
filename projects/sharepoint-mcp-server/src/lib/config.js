import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod/v4";

const ALLOWED_ACTOR_ROLES = ["Axis", "Forge", "Prime", "System"];
const READ_ONLY_TOOLS = ["lists.query", "lists.get", "docs.link"];
const WRITE_TOOLS = ["lists.create", "lists.update", "docs.upload"];
const ALL_TOOLS = [
  "lists.query",
  "lists.get",
  "lists.create",
  "lists.update",
  "docs.upload",
  "docs.link",
];

const LibrarySchema = z.object({
  driveId: z.string().min(1),
});

const AllowlistSchema = z.object({
  siteId: z.string().min(1),
  lists: z.record(z.string(), z.string().min(1)).default({}),
  libraries: z.record(z.string(), LibrarySchema).default({}),
  auditLogListName: z.string().min(1).default("MCP Audit Log"),
  executionInboxListName: z.string().min(1).default("Execution Inbox"),
  executionInboxAllowedFields: z
    .array(z.string().min(1))
    .default(["Subject", "From", "ReceivedAt", "WebLink", "MessageId"]),
});

function parseJson(raw, sourceLabel) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in ${sourceLabel}: ${error.message}`);
  }
}

async function readAllowlistConfig() {
  const jsonFromEnv = process.env.SWD_ALLOWLIST_JSON;
  if (jsonFromEnv) {
    return parseJson(jsonFromEnv, "SWD_ALLOWLIST_JSON");
  }

  const configPath = process.env.SWD_ALLOWLIST_PATH || "./config/allowlist.json";
  const resolved = path.resolve(configPath);
  const raw = await fs.readFile(resolved, "utf8");
  return parseJson(raw, resolved);
}

function parseRequiredListNames() {
  const defaultListNames = [
    "Execution Inbox",
    "Work Orders",
    "Decision Log",
    "Risk Register",
    "Release Log",
    "MCP Audit Log",
  ];

  const fromEnv = process.env.SWD_REQUIRED_LISTS?.trim();
  if (!fromEnv) return defaultListNames;
  return fromEnv
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function validateAllowlistInvariants(allowlist) {
  const requiredListNames = parseRequiredListNames();
  const missingLists = requiredListNames.filter((name) => !allowlist.lists[name]);
  if (missingLists.length) {
    throw new Error(
      `Allowlist missing required lists: ${missingLists.join(", ")}. Set their IDs in allowlist config.`
    );
  }

  if (!allowlist.libraries["Governance Docs"]) {
    throw new Error("Allowlist must include library mapping for 'Governance Docs'.");
  }

  if (!allowlist.lists[allowlist.auditLogListName]) {
    throw new Error(
      `Allowlist auditLogListName '${allowlist.auditLogListName}' is not mapped in allowlist.lists.`
    );
  }
}

export async function loadPolicyConfig() {
  const allowlistRaw = await readAllowlistConfig();
  const allowlist = AllowlistSchema.parse(allowlistRaw);
  validateAllowlistInvariants(allowlist);

  const auth = {
    tenantId: process.env.SP_TENANT_ID || "",
    clientId: process.env.SP_CLIENT_ID || "",
    clientSecret: process.env.SP_CLIENT_SECRET || "",
    authorityHost: process.env.SP_AUTHORITY_HOST || "https://login.microsoftonline.com",
    graphBaseUrl: process.env.SP_GRAPH_BASE_URL || "https://graph.microsoft.com/v1.0",
    scope: process.env.SP_GRAPH_SCOPE || "https://graph.microsoft.com/.default",
    certificateThumbprint: process.env.SP_CLIENT_CERT_THUMBPRINT || "",
    certificatePrivateKey: process.env.SP_CLIENT_CERT_PRIVATE_KEY || "",
    certificatePrivateKeyPath: process.env.SP_CLIENT_CERT_PRIVATE_KEY_PATH || "",
    certificateX5c: process.env.SP_CLIENT_CERT_X5C || "",
  };

  const writesEnabled = (process.env.SWD_ENABLE_WRITES || "false").toLowerCase() === "true";
  const phaseMode = (process.env.SWD_PHASE_MODE || "read_only").trim();
  if (!["read_only", "full"].includes(phaseMode)) {
    throw new Error("SWD_PHASE_MODE must be 'read_only' or 'full'.");
  }

  const phaseDefaultTools = phaseMode === "read_only" ? READ_ONLY_TOOLS : ALL_TOOLS;
  const enabledTools = (process.env.SWD_ENABLED_TOOLS || phaseDefaultTools.join(","))
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  const invalidTools = enabledTools.filter((name) => !phaseDefaultTools.includes(name));
  if (invalidTools.length) {
    throw new Error(
      `SWD_ENABLED_TOOLS contains unsupported tools: ${invalidTools.join(
        ", "
      )}. Allowed in '${phaseMode}' phase: ${phaseDefaultTools.join(", ")}`
    );
  }
  if (!writesEnabled) {
    const writeToolsEnabled = enabledTools.filter((name) => WRITE_TOOLS.includes(name));
    if (writeToolsEnabled.length) {
      throw new Error(
        `SWD_ENABLE_WRITES=false but write tools are enabled: ${writeToolsEnabled.join(", ")}`
      );
    }
  }

  const disabled = (process.env.MCP_DISABLED || "0").toLowerCase();
  const mcpDisabled = disabled === "1" || disabled === "true";
  const auditMode = (process.env.AUDIT_MODE || "fail_closed").trim();
  if (!["fail_closed", "fail_open"].includes(auditMode)) {
    throw new Error("AUDIT_MODE must be 'fail_closed' or 'fail_open'.");
  }

  return {
    auth,
    allowlist,
    writesEnabled,
    phaseMode,
    enabledTools,
    allowedActorRoles: ALLOWED_ACTOR_ROLES,
    mcpDisabled,
    auditMode,
  };
}
