# DocSmith Connect for Microsoft 365 - Security Acceptance Criteria (V1)

## 1. Identity and auth

1. Uses Entra app-only auth with Microsoft Graph.
2. Uses `Sites.Selected` application permission.
3. App is granted only to allowlisted site(s).
4. Certificate credentials are configured for production.
5. If certificate is absent, secret fallback use is explicitly approved and time-limited.

## 2. Authorization and scope control

1. Every tool call enforces `actor_role` and `correlation_id` presence.
2. `actor_role` is one of `Axis|Forge|Prime|System`.
3. All list/library identifiers are resolved from server allowlist.
4. Calls targeting non-allowlisted lists/libraries are denied.
5. Calls to disabled tools are denied.
6. Write tools are denied when `SWD_ENABLE_WRITES=false`.
7. `MCP_DISABLED=1` prevents connector startup.
8. `SWD_PHASE_MODE=read_only` registers only read tools.
9. `actor_role` is authorized from Entra app-role context, not trusted as free-form input.

## 3. Audit and evidence

1. Every accepted call appends exactly one audit record with result `OK|ERROR`.
2. Audit row fields include:
   - `timestamp_gst`
   - `actor_role`
   - `tool`
   - `target`
   - `correlation_id`
   - `request_hash`
   - `result`
   - `error`
3. If audit append fails, operation is reported as failure (fail-closed behavior).
4. `AUDIT_MODE=fail_open` is permitted only for development/testing.
5. Audit data retention and export path are documented for customer compliance reviews.

## 4. Data minimization

1. `Execution Inbox` write fields are restricted to metadata-only by default:
   - `Subject`, `From`, `ReceivedAt`, `WebLink`, `MessageId`
2. `Execution Inbox` create enforces `MessageId` dedupe for idempotent ingestion.
3. Connector does not expose tenant-wide search or unrestricted Graph proxy behavior.
4. Connector stores no persistent payload data outside SharePoint audit and target records.

## 5. Abuse-case controls

1. Prompt-injection attempts cannot expand scope beyond allowlisted tools and targets.
2. Arbitrary `siteId/listId/driveId` user input is not accepted by tools.
3. Request hashing enables tamper-evident correlation during incident analysis.

## 6. Release and operations

1. Shipped artifact includes versioned release notes.
2. Docker image digest/checksum is published with release.
3. Security patch policy defines SLA for critical fixes.
4. Vulnerability disclosure channel is documented and monitored.
5. Network exposure posture is restricted by default (APIM/IP allowlist/private endpoint option).

## 7. Go-live gate

Prime approval requires all criteria above plus:
1. Completed threat model review for customer deployment topology.
2. Private beta logs showing expected audit completeness.
3. Confirmed rollback procedure for connector version updates.
