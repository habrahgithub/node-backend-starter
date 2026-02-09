# Changelog

All notable changes to `DocSmith Connect for Microsoft 365` are documented in this file.

## 1.3.0-internal-beta.1 - 2026-02-09

- Internal beta baseline release (tag `v1.0.0-internal-beta.1`) that codifies the hardened V1 policy surface for the `docsmith-connect-m365` bridge.
- Locked in the MCP allowlist, read-only gating, audit, and idempotency controls introduced during the internal beta work, along with customer-hosted packaging docs and enforcement CLI tooling.
- Release artifact checksum (deterministic `git archive --prefix=docsmith-connect-m365-4da8d48/`): `4b08b4ba50d6c7f5cc7cc1002b67087e96859c8abee4f3b5dc2a75f7eeb88b9f`.

## 1.2.0 - 2026-02-08

- Productized naming as `docsmith-connect-m365`.
- Enforced required request context: `actor_role`, `correlation_id`.
- Added request hashing (`request_hash`) and snake_case audit fields.
- Restricted exposed V1 tools to:
  - `lists.query`, `lists.get`, `lists.create`, `lists.update`, `docs.upload`, `docs.link`
- Added policy operation allowlist via `SWD_ENABLED_TOOLS`.
- Added read-only registration phase via `SWD_PHASE_MODE` (default `read_only`).
- Added hard kill switch via `MCP_DISABLED`.
- Added `AUDIT_MODE` with `fail_closed` default and dev-only `fail_open`.
- Added `Execution Inbox` idempotency guard (dedupe on `MessageId`).
- Added customer-hosted packaging artifacts (`Dockerfile`, `.dockerignore`).
- Added PRD/security/schema documentation set.

## 1.1.0 - 2026-02-08

- Initial SWD policy profile:
  - server-side allowlist
  - write gating
  - audit logging
  - certificate-preferred auth
