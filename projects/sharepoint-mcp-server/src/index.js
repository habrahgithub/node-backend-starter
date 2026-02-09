import "dotenv/config";
import crypto from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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
  correlation_id: z.string().min(1).describe("Required trace ID spanning end-to-end workflow"),
  request_id: z.string().min(1).optional().describe("Optional caller request ID"),
};

function buildToolResult({ isError = false, structuredContent }) {
  return {
    isError,
    content: [{ type: "text", text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
  };
}

function normalizeRequestContext(input) {
  return {
    actor_role: input.actor_role,
    correlation_id: input.correlation_id,
    request_id: input.request_id || crypto.randomUUID(),
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
    actor_role: event.actor_role,
    tool: event.tool,
    target: event.target,
    correlation_id: event.correlation_id,
    request_hash: event.request_hash,
    result: event.result,
    error: truncateValue(event.error || ""),
  };

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
  assertActorRoleAllowed(policy, context.actor_role);
  assertToolEnabled(policy, toolName);

  const request_hash = buildRequestHash({ tool: toolName, target, payload: input });

  try {
    const data = await run();
    try {
      await appendAuditLog({
        graph,
        policy,
        event: {
          actor_role: context.actor_role,
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
          actor_role: context.actor_role,
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

  const server = new McpServer({
    name: "docsmith-connect-m365",
    version: "1.2.0",
  });

  registerTools({ server, graph, policy });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `docsmith-connect-m365 running on stdio (phase=${policy.phaseMode}, writes=${policy.writesEnabled ? "on" : "off"}, audit_mode=${policy.auditMode})`
  );
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
