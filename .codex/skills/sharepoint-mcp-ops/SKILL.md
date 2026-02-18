---
name: sharepoint-mcp-ops
description: Operate and troubleshoot the SharePoint MCP server for DocSmith Connect, including transport mode, allowlist config, security posture, and container packaging. Use when working in projects/sharepoint-mcp-server.
---

# SharePoint MCP Ops

## Scope

Operate `projects/sharepoint-mcp-server`.

## Workflow

1. Prepare config files:
   - `cp .env.example .env`
   - `cp config/allowlist.example.json config/allowlist.json`
2. Validate required auth and allowlist variables.
3. Run standard transport:
   - `npm start`
4. Run HTTP transport when needed:
   - `MCP_TRANSPORT=http MCP_HTTP_HOST=127.0.0.1 MCP_HTTP_PORT=3900 MCP_HTTP_PATH=/mcp npm start`
5. Run tests:
   - `npm test`

## Container Workflow

1. Build image:
   - `docker build -t docsmith-connect-m365:latest .`
2. Run image:
   - `docker run --rm --env-file .env -v "$PWD/config:/app/config:ro" docsmith-connect-m365:latest`

## Security and Rollout Rules

- Keep `MCP_DISABLED=0` only for approved environments.
- Use `SWD_ROLE_MISMATCH_MODE=reject` and `SWD_REQUIRE_TOKEN_ROLE=true` in production.
- Keep `SWD_ENABLE_WRITES=false` until write rollout approval.
- Restrict enabled tools with `SWD_ENABLED_TOOLS` when needed.
