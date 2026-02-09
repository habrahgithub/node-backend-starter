# DocSmith Connect (M365) - Production Boundary Spec (V1)

## 1. Hosting boundary

- Deployment model: customer-hosted in customer Azure tenant.
- Runtime target: Azure Functions (Consumption) for GA baseline.
- MCP interaction model: local stdio MCP adapter calls Azure API over HTTPS.

## 2. Network exposure decision

Default V1 posture is **restricted exposure**, not open internet.

Recommended ingress controls:
- Azure Functions secured by Entra auth.
- API Management in front of Function App for:
  - IP allowlists
  - throttling
  - quota controls
- Optional private endpoint for stricter enterprise environments.

## 3. Microsoft-native components

- Azure Function App (`docsmith-connect-api`)
- Azure Key Vault (Graph certificate/private key material)
- Managed Identity on Function App (Key Vault access)
- Application Insights (operational telemetry)
- Microsoft Graph (`Sites.Selected`, app-only)
- SharePoint site scope: one allowlisted site (for example `SWD OS`)

## 4. Identity and authorization

- Graph app registration: `docsmith-connect-graph`
- Graph permission: `Sites.Selected` only
- Site grant: only allowlisted site(s)
- Credential mode: certificate preferred, client secret local-dev fallback only
- Role model:
  - API validates Entra app roles (`Prime`, `Axis`, `Forge`, `System`)
  - `actor_role` request field must match authorized role context

## 5. Control plane config

Required controls:
- `MCP_DISABLED` (`1` disables connector startup)
- `SWD_PHASE_MODE` (`read_only` or `full`)
- `SWD_ENABLE_WRITES` (`true` only after Prime approval)
- `SWD_ALLOWLIST_PATH` / `SWD_ALLOWLIST_JSON`
- `AUDIT_MODE` (`fail_closed` default, `fail_open` for dev only)

## 6. Allowed operations (V1)

- `lists.query`
- `lists.get`
- `lists.create`
- `lists.update`
- `docs.upload`
- `docs.link`

Disallowed in V1:
- Arbitrary Graph proxying
- Tenant-wide search
- Mail/users/teams scopes

## 7. Audit and evidence guarantees

Every call appends to `MCP Audit Log` with:
- `timestamp_gst`
- `actor_role`
- `tool`
- `target`
- `correlation_id`
- `request_hash`
- `result`
- `error`

Fail behavior:
- `AUDIT_MODE=fail_closed` (production): operation fails if audit append fails.
- `AUDIT_MODE=fail_open` (development only): operation may return with `audit_warning`.

## 8. Go-live evidence checklist

- Allowlist config snapshot
- Entra permission screenshot (`Sites.Selected`)
- Site grant proof for target site only
- Sample audit export showing `OK` and `ERROR` entries
- Runtime config proof for:
  - `MCP_DISABLED=0`
  - `SWD_PHASE_MODE=read_only` during rollout
  - `SWD_ENABLE_WRITES=false` until approved

