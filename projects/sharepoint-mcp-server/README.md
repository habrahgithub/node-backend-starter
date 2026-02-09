# DocSmith Connect for Microsoft 365

DocSmith Connect for Microsoft 365 is a customer-hosted connector that provides a governed tool surface for SharePoint Sites, Microsoft Lists, and Document Libraries.

MCP is the interface. The product outcome is governance + execution automation in Microsoft 365 with least privilege and auditability.

## Product scope (V1)

- Customer-hosted bridge in tenant (Azure Functions Consumption baseline)
- Graph app-only auth with `Sites.Selected`
- Single-site allowlist (`SWD OS` or equivalent)
- MCP client compatibility model: local stdio adapter -> HTTPS API in Azure
- Small tool surface only:
  - `lists.query({ list, filter, top })`
  - `lists.get({ list, itemId })`
  - `lists.create({ list, fields })`
  - `lists.update({ list, itemId, fields })`
  - `docs.upload({ library, folderPath, filename, content })`
  - `docs.link({ library, itemId })`

## Security contract

1. Requests without `actor_role` and `correlation_id` are rejected.
2. Allowed actor roles: `Axis | Forge | Prime | System`.
3. All list/library access is server-resolved from allowlist config.
4. Non-allowlisted operations are blocked (`SWD_ENABLED_TOOLS`).
5. Hard kill switch: `MCP_DISABLED=1` prevents startup.
6. Read-only phase mode (`SWD_PHASE_MODE=read_only`) only registers:
   - `lists.query`, `lists.get`, `docs.link`
7. Writes are rollout-gated by `SWD_ENABLE_WRITES` (default `false`).
8. Every tool call writes one audit row to `MCP Audit Log`:
   - `timestamp_gst`, `actor_role`, `tool`, `target`, `correlation_id`, `request_hash`, `result`, `error`
9. `Execution Inbox` is metadata-only by default:
   - `Subject`, `From`, `ReceivedAt`, `WebLink`, `MessageId`
10. `Execution Inbox` `MessageId` is deduplicated on create for idempotent intake.

## Network posture (V1 default)

- Restricted exposure (recommended baseline), not open internet.
- Function App behind Entra auth.
- Use APIM for IP allowlist, throttling, and request quotas.
- Optional private endpoint for higher-assurance customer environments.

## Entra / Graph setup

1. Register Entra app in customer tenant.
2. Add Graph application permission: `Sites.Selected`.
3. Grant site-level access only to allowed site(s) (for example `SWD OS`).
4. Prefer certificate auth (`SP_CLIENT_CERT_*`), keep `SP_CLIENT_SECRET` fallback-only.

## Configure

```bash
cp .env.example .env
cp config/allowlist.example.json config/allowlist.json
```

Set `.env` values:
- `SP_TENANT_ID`, `SP_CLIENT_ID`
- certificate auth vars (`SP_CLIENT_CERT_THUMBPRINT`, private key path/content)
- `SWD_ALLOWLIST_PATH`
- `MCP_DISABLED=0`
- `SWD_PHASE_MODE=read_only` for read-only rollout
- `SWD_ENABLE_WRITES=false` until Prime write approval
- `AUDIT_MODE=fail_closed` for production (`fail_open` for dev only)
- optional `SWD_ENABLED_TOOLS` to narrow enabled operations

Set `config/allowlist.json` values:
- site ID
- list IDs: `Execution Inbox`, `Work Orders`, `Decision Log`, `Risk Register`, `Release Log`, `MCP Audit Log`
- library IDs: `Governance Docs`

## Run locally

```bash
npm start
```

## Container packaging

```bash
docker build -t docsmith-connect-m365:latest .
docker run --rm --env-file .env -v "$PWD/config:/app/config:ro" docsmith-connect-m365:latest
```

Generate release checksum:

```bash
docker save docsmith-connect-m365:latest | sha256sum
```

## MCP client config example

```json
{
  "mcpServers": {
    "docsmith-connect-m365": {
      "command": "node",
      "args": ["projects/sharepoint-mcp-server/src/index.js"],
      "env": {
        "SP_TENANT_ID": "...",
        "SP_CLIENT_ID": "...",
        "SP_CLIENT_CERT_THUMBPRINT": "...",
        "SP_CLIENT_CERT_PRIVATE_KEY_PATH": "...",
        "SWD_ALLOWLIST_PATH": "projects/sharepoint-mcp-server/config/allowlist.json",
        "SWD_ENABLE_WRITES": "false"
      }
    }
  }
}
```

## Rollout

1. Phase 1: read-oriented tools only (`lists.query`, `lists.get`, `docs.link`).
2. Validate audit log integrity for 2-3 days.
3. Enable writes for `Execution Inbox`.
4. Expand writes to `Work Orders`, then `Decision Log`, then docs upload.

## Additional artifacts

- PRD: `docs/03-Architecture/DocSmith-Connect-M365-PRD.md`
- Security criteria: `docs/04-Security/DocSmith-Connect-M365-Security-Acceptance.md`
- SharePoint list schemas: `docs/04-Security/SharePoint-List-Schemas.md`
- Production boundary: `docs/03-Architecture/DocSmith-Connect-M365-Production-Boundary.md`
- Changelog: `CHANGELOG.md`
- Security policy: `SECURITY.md`
