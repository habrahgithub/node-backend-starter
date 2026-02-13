import "dotenv/config";
import crypto from "node:crypto";
import { createServer } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import * as z from "zod/v4";
import { base64DecodeToBuffer } from "./lib/base64.js";
import { loadPolicyConfig } from "./lib/config.js";
import { createGraphClient } from "./lib/graph.js";
import { HttpError, readResponseBody } from "./lib/http.js";

class PolicyError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "PolicyError";
    this.details = details;
  }
}

const ActorRoleSchema = z.enum(["Axis", "Forge", "Prime", "System"]);

const AuditContextInputSchema = {
  actor_role: ActorRoleSchema.describe("Required role for every request"),
  token_roles: z
    .array(z.string().min(1))
    .optional()
    .describe(
      "Trusted Entra token role claims. Must be injected by the authenticated host runtime, not end-user payload."
    ),
  correlation_id: z.string().min(1).describe("Required trace ID spanning end-to-end workflow"),
  request_id: z.string().min(1).optional().describe("Optional caller request ID"),
};

const SUPPORTED_TRANSPORTS = new Set(["stdio", "http"]);

function buildToolResult({ isError = false, structuredContent }) {
  return {
    isError,
    content: [{ type: "text", text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
  };
}

function normalizeRequestContext(input) {
  return {
    declared_actor_role: input.actor_role,
    token_roles: Array.isArray(input.token_roles) ? input.token_roles : [],
    correlation_id: input.correlation_id,
    request_id: input.request_id || crypto.randomUUID(),
  };
}

function normalizeRoleValue(role) {
  if (typeof role !== "string") return "";
  return role.trim();
}

function normalizeRoleSet(roles) {
  return [...new Set((roles || []).map((role) => normalizeRoleValue(role)).filter(Boolean))];
}

function extractAuthoritativeRoles(policy, tokenRoles) {
  const allowedByLower = new Map(
    policy.allowedActorRoles.map((role) => [role.toLowerCase(), role])
  );
  const authoritative = normalizeRoleSet(tokenRoles)
    .map((role) => allowedByLower.get(role.toLowerCase()))
    .filter(Boolean);
  return [...new Set(authoritative)];
}

function bindActorRole(policy, context) {
  const declaredRole = normalizeRoleValue(context.declared_actor_role);
  const authoritativeRoles = extractAuthoritativeRoles(policy, context.token_roles);
  const hasTokenRole = authoritativeRoles.length > 0;

  if (policy.requireTokenRole && !hasTokenRole) {
    throw new PolicyError(
      "No supported Entra app-role claim was provided. Authorization requires token_roles context.",
      {
        declared_actor_role: declaredRole,
        token_roles: normalizeRoleSet(context.token_roles),
        allowedActorRoles: policy.allowedActorRoles,
      }
    );
  }

  if (authoritativeRoles.length > 1) {
    throw new PolicyError("Ambiguous Entra role context: multiple supported token roles provided.", {
      token_roles: authoritativeRoles,
      allowedActorRoles: policy.allowedActorRoles,
    });
  }

  const effectiveRole = authoritativeRoles[0] || declaredRole;
  const roleMismatch = Boolean(effectiveRole && declaredRole && effectiveRole !== declaredRole);

  if (roleMismatch && policy.roleMismatchMode === "reject") {
    throw new PolicyError(
      `Declared actor_role '${declaredRole}' does not match token-derived role '${effectiveRole}'.`,
      {
        declared_actor_role: declaredRole,
        effective_actor_role: effectiveRole,
        token_roles: normalizeRoleSet(context.token_roles),
      }
    );
  }

  return {
    declared_actor_role: declaredRole,
    effective_actor_role: effectiveRole,
    role_mismatch: roleMismatch,
    token_roles: normalizeRoleSet(context.token_roles),
  };
}

function getErrorCode(error) {
  if (error instanceof PolicyError) return "POLICY_DENY";
  if (error instanceof HttpError) return `HTTP_${error.status || "ERR"}`;
  return "UNHANDLED";
}

function truncateValue(value, max = 300) {
  if (!value) return "";
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

function toGstIsoString(date = new Date()) {
  const gstMillis = date.getTime() + 4 * 60 * 60 * 1000;
  return new Date(gstMillis).toISOString().replace("Z", "+04:00");
}

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

function buildRequestHash({ tool, target, payload }) {
  const serialized = stableSerialize({ tool, target, payload });
  return crypto.createHash("sha256").update(serialized).digest("hex");
}

function assertToolEnabled(policy, toolName) {
  if (!policy.enabledTools.includes(toolName)) {
    throw new PolicyError(`Tool '${toolName}' is disabled by policy.`, {
      requestedTool: toolName,
      enabledTools: policy.enabledTools,
    });
  }
}

function assertActorRoleAllowed(policy, actorRole) {
  if (!policy.allowedActorRoles.includes(actorRole)) {
    throw new PolicyError(`actor_role '${actorRole}' is not allowed.`, {
      actorRole,
      allowedActorRoles: policy.allowedActorRoles,
    });
  }
}

function isToolEnabled(policy, toolName) {
  return policy.enabledTools.includes(toolName);
}

function resolveListId(policy, listName) {
  const listId = policy.allowlist.lists[listName];
  if (!listId) {
    throw new PolicyError(`List '${listName}' is not allowlisted.`, {
      listName,
      allowedLists: Object.keys(policy.allowlist.lists),
    });
  }
  return listId;
}

function resolveLibrary(policy, libraryName) {
  const library = policy.allowlist.libraries[libraryName];
  if (!library) {
    throw new PolicyError(`Library '${libraryName}' is not allowlisted.`, {
      libraryName,
      allowedLibraries: Object.keys(policy.allowlist.libraries),
    });
  }
  return library;
}

function assertWritesEnabled(policy, toolName) {
  if (!policy.writesEnabled) {
    throw new PolicyError(`Writes are disabled. '${toolName}' is blocked in this rollout stage.`);
  }
}

function enforceExecutionInboxFieldPolicy(policy, listName, fields) {
  if (listName !== policy.allowlist.executionInboxListName) return fields;

  const allowed = new Set(policy.allowlist.executionInboxAllowedFields);
  const disallowed = Object.keys(fields).filter((fieldName) => !allowed.has(fieldName));
  if (disallowed.length) {
    throw new PolicyError(
      `Execution Inbox supports metadata-only fields in V1. Rejected: ${disallowed.join(", ")}`,
      {
        disallowed,
        allowed: [...allowed],
      }
    );
  }
  return fields;
}

function encodeDrivePath(pathValue) {
  return pathValue
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function escapeODataStringLiteral(value) {
  return value.replace(/'/g, "''");
}

async function appendAuditLog({ graph, policy, event }) {
  const auditListId = resolveListId(policy, policy.allowlist.auditLogListName);
  const auditFields = {
    timestamp_gst: toGstIsoString(),
    actor_role: event.effective_actor_role,
    tool: event.tool,
    target: event.target,
    correlation_id: event.correlation_id,
    request_hash: event.request_hash,
    result: event.result,
    error: truncateValue(event.error || ""),
  };
  if (policy.includeRoleBindingAuditFields) {
    auditFields.declared_actor_role = event.declared_actor_role;
    auditFields.effective_actor_role = event.effective_actor_role;
    auditFields.role_mismatch = event.role_mismatch;
  }

  await graph.request(`/sites/${policy.allowlist.siteId}/lists/${auditListId}/items`, {
    method: "POST",
    body: { fields: auditFields },
  });
}

async function assertExecutionInboxMessageIdUnique({ graph, policy, listName, fields }) {
  if (listName !== policy.allowlist.executionInboxListName) return;
  const messageId = fields.MessageId;
  if (typeof messageId !== "string" || !messageId.trim()) {
    throw new PolicyError("Execution Inbox writes require a non-empty MessageId for idempotency.");
  }

  const escapedMessageId = escapeODataStringLiteral(messageId.trim());
  const listId = resolveListId(policy, listName);
  const lookup = await graph.request(`/sites/${policy.allowlist.siteId}/lists/${listId}/items`, {
    query: {
      $top: 1,
      $expand: "fields($select=MessageId)",
      $filter: `fields/MessageId eq '${escapedMessageId}'`,
    },
  });

  if ((lookup?.value ?? []).length > 0) {
    throw new PolicyError(`Duplicate MessageId rejected for '${listName}'.`, {
      list: listName,
      messageId: messageId.trim(),
    });
  }
}

function enrichError(error, context) {
  if (error instanceof HttpError) {
    return {
      error: error.name,
      message: error.message,
      status: error.status ?? null,
      code: getErrorCode(error),
      request_id: context.request_id,
      correlation_id: context.correlation_id,
      body: error.body ?? null,
      url: error.url ?? null,
    };
  }

  if (error instanceof PolicyError) {
    return {
      error: error.name,
      message: error.message,
      code: getErrorCode(error),
      request_id: context.request_id,
      correlation_id: context.correlation_id,
      details: error.details ?? null,
    };
  }

  return {
    error: "Error",
    message: error?.message || String(error),
    code: getErrorCode(error),
    request_id: context.request_id,
    correlation_id: context.correlation_id,
  };
}

async function executeWithAudit({ graph, policy, toolName, target, input, context, run }) {
  const request_hash = buildRequestHash({ tool: toolName, target, payload: input });
  let roleBinding = {
    declared_actor_role: context.declared_actor_role,
    effective_actor_role: context.declared_actor_role,
    role_mismatch: false,
    token_roles: normalizeRoleSet(context.token_roles),
  };

  try {
    roleBinding = bindActorRole(policy, context);
    assertActorRoleAllowed(policy, roleBinding.effective_actor_role);
    assertToolEnabled(policy, toolName);

    const data = await run();
    try {
      await appendAuditLog({
        graph,
        policy,
        event: {
          ...roleBinding,
          tool: toolName,
          target,
          correlation_id: context.correlation_id,
          request_hash,
          result: "OK",
          error: "",
        },
      });
    } catch (auditError) {
      const auditPayload = enrichError(auditError, context);
      if (policy.auditMode !== "fail_open") {
        return buildToolResult({
          isError: true,
          structuredContent: {
            request_id: context.request_id,
            correlation_id: context.correlation_id,
            request_hash,
            error: "AuditFailure",
            message: "Operation rejected because audit logging failed.",
            audit_error: auditPayload,
          },
        });
      }

      return buildToolResult({
        structuredContent: {
          request_id: context.request_id,
          correlation_id: context.correlation_id,
          request_hash,
          auth_context: roleBinding,
          data,
          audit_warning: {
            mode: policy.auditMode,
            message: "Audit logging failed but operation continued due to fail_open mode.",
            audit_error: auditPayload,
          },
        },
      });
    }

    return buildToolResult({
      structuredContent: {
        request_id: context.request_id,
        correlation_id: context.correlation_id,
        request_hash,
        auth_context: roleBinding,
        data,
      },
    });
  } catch (error) {
    const errorPayload = enrichError(error, context);

    try {
      await appendAuditLog({
        graph,
        policy,
        event: {
          ...roleBinding,
          tool: toolName,
          target,
          correlation_id: context.correlation_id,
          request_hash,
          result: "ERROR",
          error: `${errorPayload.code}: ${errorPayload.message}`,
        },
      });
    } catch (auditError) {
      const auditPayload = enrichError(auditError, context);
      if (policy.auditMode === "fail_open") {
        return buildToolResult({
          isError: true,
          structuredContent: {
            ...errorPayload,
            request_hash,
            auth_context: roleBinding,
            audit_warning: {
              mode: policy.auditMode,
              message: "Audit logging of error failed; returning operation error in fail_open mode.",
              audit_error: auditPayload,
            },
          },
        });
      }
      return buildToolResult({
        isError: true,
        structuredContent: {
          request_id: context.request_id,
          correlation_id: context.correlation_id,
          request_hash,
          error: "AuditFailure",
          message: "Operation rejected because audit logging failed.",
          operation_error: errorPayload,
          audit_error: auditPayload,
        },
      });
    }

    return buildToolResult({
      isError: true,
      structuredContent: {
        ...errorPayload,
        request_hash,
        auth_context: roleBinding,
      },
    });
  }
}

function registerTools({ server, graph, policy }) {
  if (isToolEnabled(policy, "lists.query")) {
    server.registerTool(
      "lists.query",
      {
      description: "Query items from one allowlisted SharePoint list in SWD OS site.",
      inputSchema: {
        ...AuditContextInputSchema,
        list: z.string().min(1),
        filter: z.string().optional(),
        top: z.number().int().positive().max(200).optional(),
      },
      outputSchema: {
        request_id: z.string(),
        correlation_id: z.string(),
        request_hash: z.string(),
        data: z.object({
          items: z.array(z.any()),
        }),
      },
    },
    async (input) => {
      const context = normalizeRequestContext(input);
      const target = `list:${input.list}`;

      return executeWithAudit({
        graph,
        policy,
        toolName: "lists.query",
        target,
        input,
        context,
        run: async () => {
          const listId = resolveListId(policy, input.list);
          const response = await graph.request(
            `/sites/${policy.allowlist.siteId}/lists/${listId}/items`,
            {
              query: {
                $expand: "fields",
                ...(input.filter ? { $filter: input.filter } : {}),
                ...(input.top ? { $top: input.top } : {}),
              },
            }
          );

          return {
            items: response?.value ?? [],
          };
        },
      });
      }
    );
  }

  if (isToolEnabled(policy, "lists.get")) {
    server.registerTool(
      "lists.get",
      {
      description: "Get one item from one allowlisted SharePoint list.",
      inputSchema: {
        ...AuditContextInputSchema,
        list: z.string().min(1),
        itemId: z.string().min(1),
      },
      outputSchema: {
        request_id: z.string(),
        correlation_id: z.string(),
        request_hash: z.string(),
        data: z.object({
          item: z.any(),
        }),
      },
    },
    async (input) => {
      const context = normalizeRequestContext(input);
      const target = `list:${input.list}/item:${input.itemId}`;

      return executeWithAudit({
        graph,
        policy,
        toolName: "lists.get",
        target,
        input,
        context,
        run: async () => {
          const listId = resolveListId(policy, input.list);
          const item = await graph.request(
            `/sites/${policy.allowlist.siteId}/lists/${listId}/items/${input.itemId}`,
            {
              query: {
                $expand: "fields",
              },
            }
          );

          return {
            item,
          };
        },
      });
      }
    );
  }

  if (isToolEnabled(policy, "lists.create")) {
    server.registerTool(
      "lists.create",
      {
      description: "Create an item in one allowlisted SharePoint list.",
      inputSchema: {
        ...AuditContextInputSchema,
        list: z.string().min(1),
        fields: z.record(z.string(), z.any()),
      },
      outputSchema: {
        request_id: z.string(),
        correlation_id: z.string(),
        request_hash: z.string(),
        data: z.object({
          id: z.string().optional(),
          webUrl: z.string().optional(),
          fields: z.any().optional(),
        }),
      },
    },
    async (input) => {
      const context = normalizeRequestContext(input);
      const target = `list:${input.list}`;

      return executeWithAudit({
        graph,
        policy,
        toolName: "lists.create",
        target,
        input,
        context,
        run: async () => {
          assertWritesEnabled(policy, "lists.create");
          const listId = resolveListId(policy, input.list);
          const fields = enforceExecutionInboxFieldPolicy(policy, input.list, input.fields);
          await assertExecutionInboxMessageIdUnique({
            graph,
            policy,
            listName: input.list,
            fields,
          });

          const item = await graph.request(`/sites/${policy.allowlist.siteId}/lists/${listId}/items`, {
            method: "POST",
            body: { fields },
          });

          return {
            id: item?.id,
            webUrl: item?.webUrl,
            fields: item?.fields,
          };
        },
      });
      }
    );
  }

  if (isToolEnabled(policy, "lists.update")) {
    server.registerTool(
      "lists.update",
      {
      description: "Update an item in one allowlisted SharePoint list.",
      inputSchema: {
        ...AuditContextInputSchema,
        list: z.string().min(1),
        itemId: z.string().min(1),
        fields: z.record(z.string(), z.any()),
      },
      outputSchema: {
        request_id: z.string(),
        correlation_id: z.string(),
        request_hash: z.string(),
        data: z.object({
          ok: z.boolean(),
        }),
      },
    },
    async (input) => {
      const context = normalizeRequestContext(input);
      const target = `list:${input.list}/item:${input.itemId}`;

      return executeWithAudit({
        graph,
        policy,
        toolName: "lists.update",
        target,
        input,
        context,
        run: async () => {
          assertWritesEnabled(policy, "lists.update");
          const listId = resolveListId(policy, input.list);
          const fields = enforceExecutionInboxFieldPolicy(policy, input.list, input.fields);

          await graph.request(
            `/sites/${policy.allowlist.siteId}/lists/${listId}/items/${input.itemId}/fields`,
            {
              method: "PATCH",
              body: fields,
            }
          );

          return { ok: true };
        },
      });
      }
    );
  }

  if (isToolEnabled(policy, "docs.upload")) {
    server.registerTool(
      "docs.upload",
      {
      description: "Upload/replace a file in one allowlisted library.",
      inputSchema: {
        ...AuditContextInputSchema,
        library: z.string().min(1),
        folderPath: z.string().optional(),
        filename: z.string().min(1),
        content: z.string().min(1).describe("Base64-encoded file bytes"),
        contentType: z.string().optional(),
      },
      outputSchema: {
        request_id: z.string(),
        correlation_id: z.string(),
        request_hash: z.string(),
        data: z.object({
          id: z.string().optional(),
          name: z.string().optional(),
          webUrl: z.string().optional(),
          size: z.number().optional(),
        }),
      },
    },
    async (input) => {
      const context = normalizeRequestContext(input);
      const target = `library:${input.library}`;

      return executeWithAudit({
        graph,
        policy,
        toolName: "docs.upload",
        target,
        input,
        context,
        run: async () => {
          assertWritesEnabled(policy, "docs.upload");
          if (input.filename.includes("/") || input.filename.includes("\\")) {
            throw new PolicyError("filename must not contain path separators.");
          }

          const library = resolveLibrary(policy, input.library);
          const folder = input.folderPath?.replace(/^\/+|\/+$/g, "") || "";
          const fullPath = folder ? `${folder}/${input.filename}` : input.filename;
          const encodedPath = encodeDrivePath(fullPath);
          const bytes = base64DecodeToBuffer(input.content);

          const response = await graph.requestRaw(
            `/drives/${library.driveId}/root:/${encodedPath}:/content`,
            {
              method: "PUT",
              headers: {
                ...(input.contentType ? { "content-type": input.contentType } : {}),
              },
              body: bytes,
            }
          );

          const responseBody = await readResponseBody(response);
          if (!response.ok) {
            throw new HttpError("Upload failed", {
              status: response.status,
              url: response.url,
              body: responseBody,
            });
          }

          return {
            id: responseBody?.id,
            name: responseBody?.name,
            webUrl: responseBody?.webUrl,
            size: responseBody?.size,
          };
        },
      });
      }
    );
  }

  if (isToolEnabled(policy, "docs.link")) {
    server.registerTool(
      "docs.link",
      {
      description: "Return a SharePoint link for a file item from an allowlisted library.",
      inputSchema: {
        ...AuditContextInputSchema,
        library: z.string().min(1),
        itemId: z.string().min(1),
      },
      outputSchema: {
        request_id: z.string(),
        correlation_id: z.string(),
        request_hash: z.string(),
        data: z.object({
          id: z.string().optional(),
          name: z.string().optional(),
          webUrl: z.string().optional(),
          size: z.number().optional(),
        }),
      },
    },
    async (input) => {
      const context = normalizeRequestContext(input);
      const target = `library:${input.library}/item:${input.itemId}`;

      return executeWithAudit({
        graph,
        policy,
        toolName: "docs.link",
        target,
        input,
        context,
        run: async () => {
          const library = resolveLibrary(policy, input.library);
          const item = await graph.request(`/drives/${library.driveId}/items/${input.itemId}`, {
            query: { $select: "id,name,webUrl,size" },
          });

          return {
            id: item?.id,
            name: item?.name,
            webUrl: item?.webUrl,
            size: item?.size,
          };
        },
      });
      }
    );
  }
}

function createMcpToolServer({ graph, policy }) {
  const server = new McpServer({
    name: "docsmith-connect-m365",
    version: "1.2.0",
  });

  registerTools({ server, graph, policy });
  return server;
}

function normalizeHttpPath(value) {
  const raw = (value || "/mcp").trim();
  if (!raw) {
    throw new Error("MCP_HTTP_PATH must not be empty when MCP_TRANSPORT=http.");
  }
  if (!raw.startsWith("/")) {
    throw new Error("MCP_HTTP_PATH must start with '/'.");
  }
  if (raw === "/") return raw;
  return raw.replace(/\/+$/, "");
}

function parseHttpPort(value) {
  const parsed = Number.parseInt(value || "3900", 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error("MCP_HTTP_PORT must be an integer between 1 and 65535.");
  }
  return parsed;
}

function resolveTransportConfig() {
  const transport = (process.env.MCP_TRANSPORT || "stdio").trim().toLowerCase();
  if (!SUPPORTED_TRANSPORTS.has(transport)) {
    throw new Error(
      `MCP_TRANSPORT must be one of: ${[...SUPPORTED_TRANSPORTS].join(", ")} (received '${transport}').`
    );
  }

  if (transport === "http") {
    return {
      mode: "http",
      host: (process.env.MCP_HTTP_HOST || "127.0.0.1").trim() || "127.0.0.1",
      port: parseHttpPort(process.env.MCP_HTTP_PORT),
      path: normalizeHttpPath(process.env.MCP_HTTP_PATH),
    };
  }

  return { mode: "stdio" };
}

function writeJsonResponse(res, statusCode, payload, extraHeaders = {}) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  for (const [name, value] of Object.entries(extraHeaders)) {
    if (value !== undefined && value !== null) {
      res.setHeader(name, value);
    }
  }
  res.end(JSON.stringify(payload));
}

function writeHttpError(res, { statusCode, code, message, details, headers }) {
  writeJsonResponse(
    res,
    statusCode,
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    headers
  );
}

function requestPathname(req) {
  const host = req.headers.host || "127.0.0.1";
  const url = new URL(req.url || "/", `http://${host}`);
  return url.pathname;
}

function isJsonContentType(contentTypeHeader) {
  const raw = Array.isArray(contentTypeHeader) ? contentTypeHeader[0] : contentTypeHeader;
  if (typeof raw !== "string" || !raw.trim()) return false;
  return raw.split(";")[0].trim().toLowerCase() === "application/json";
}

async function readBodyUtf8(req, maxBytes = 1_000_000) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > maxBytes) {
      throw new Error(`Request body exceeds max size of ${maxBytes} bytes.`);
    }
    chunks.push(buffer);
  }

  if (chunks.length === 0) return "";
  return Buffer.concat(chunks).toString("utf8");
}

async function handleStreamableHttpRequest({ req, res, policy, graph, httpPath }) {
  if (requestPathname(req) !== httpPath) {
    writeHttpError(res, {
      statusCode: 404,
      code: "NOT_FOUND",
      message: `No MCP route configured for '${req.url || "/"}'.`,
      details: { expected_path: httpPath },
    });
    return;
  }

  if ((req.method || "").toUpperCase() !== "POST") {
    writeHttpError(res, {
      statusCode: 405,
      code: "METHOD_NOT_ALLOWED",
      message: "Only POST is supported for this MCP HTTP endpoint.",
      details: { method: req.method || null },
      headers: { allow: "POST" },
    });
    return;
  }

  if (!isJsonContentType(req.headers["content-type"])) {
    writeHttpError(res, {
      statusCode: 415,
      code: "UNSUPPORTED_MEDIA_TYPE",
      message: "POST requests must use content-type application/json.",
      details: { content_type: req.headers["content-type"] || null },
    });
    return;
  }

  let parsedBody;
  try {
    const rawBody = await readBodyUtf8(req);
    parsedBody = rawBody ? JSON.parse(rawBody) : {};
  } catch (error) {
    writeHttpError(res, {
      statusCode: 400,
      code: "BAD_JSON",
      message: "Request body must be valid JSON.",
      details: { reason: error?.message || String(error) },
    });
    return;
  }

  const server = createMcpToolServer({ graph, policy });
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, parsedBody);
  } catch (error) {
    console.error("HTTP transport request failed:", error);
    if (!res.headersSent) {
      writeHttpError(res, {
        statusCode: 500,
        code: "INTERNAL_ERROR",
        message: "Failed to process MCP request.",
      });
    }
  } finally {
    await Promise.allSettled([transport.close(), server.close()]);
  }
}

async function startHttpTransport({ graph, policy, host, port, path }) {
  const httpServer = createServer((req, res) => {
    handleStreamableHttpRequest({ req, res, policy, graph, httpPath: path }).catch((error) => {
      console.error("Unhandled HTTP request error:", error);
      if (!res.headersSent) {
        writeHttpError(res, {
          statusCode: 500,
          code: "INTERNAL_ERROR",
          message: "Unhandled server error.",
        });
      }
    });
  });

  await new Promise((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(port, host, () => {
      httpServer.off("error", reject);
      resolve();
    });
  });

  console.error(
    `docsmith-connect-m365 running on streamable HTTP (url=http://${host}:${port}${path}, phase=${policy.phaseMode}, writes=${policy.writesEnabled ? "on" : "off"}, audit_mode=${policy.auditMode})`
  );
}

async function startStdioTransport({ graph, policy }) {
  const server = createMcpToolServer({ graph, policy });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `docsmith-connect-m365 running on stdio (phase=${policy.phaseMode}, writes=${policy.writesEnabled ? "on" : "off"}, audit_mode=${policy.auditMode})`
  );
}

async function main() {
  const policy = await loadPolicyConfig();
  if (policy.mcpDisabled) {
    console.error("docsmith-connect-m365 is disabled by MCP_DISABLED.");
    process.exit(78);
  }

  const graph = createGraphClient({
    tenantId: policy.auth.tenantId,
    clientId: policy.auth.clientId,
    clientSecret: policy.auth.clientSecret,
    certificateThumbprint: policy.auth.certificateThumbprint,
    certificatePrivateKey: policy.auth.certificatePrivateKey,
    certificatePrivateKeyPath: policy.auth.certificatePrivateKeyPath,
    certificateX5c: policy.auth.certificateX5c,
    authorityHost: policy.auth.authorityHost,
    graphBaseUrl: policy.auth.graphBaseUrl,
    scope: policy.auth.scope,
  });

  const transportConfig = resolveTransportConfig();
  if (transportConfig.mode === "http") {
    await startHttpTransport({
      graph,
      policy,
      host: transportConfig.host,
      port: transportConfig.port,
      path: transportConfig.path,
    });
    return;
  }

  await startStdioTransport({ graph, policy });
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
