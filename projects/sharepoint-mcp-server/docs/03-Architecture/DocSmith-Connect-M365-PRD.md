# DocSmith Connect for Microsoft 365 - PRD (V1)

## 1. Product summary

`DocSmith Connect for Microsoft 365` is a customer-hosted connector that exposes a governed SharePoint + Microsoft Lists + Document Libraries toolset to AI agents through MCP.

Goal: provide reliable intake -> triage -> work orders -> evidence storage workflows with least privilege and auditable execution.

## 2. Target users

- Operations teams running SWD OS workflows in Microsoft 365
- Compliance and governance owners who require immutable activity records

## 3. Scope

In scope:
- Single-tenant customer-hosted deployment
- Graph app-only auth
- Site-scoped permissions (`Sites.Selected`)
- Allowlisted lists/libraries
- V1 tool set:
  - `lists.query`
  - `lists.get`
  - `lists.create`
  - `lists.update`
  - `docs.upload`
  - `docs.link`

Out of scope (V1):
- Tenant-wide Graph proxying
- Mail/users/teams APIs
- Multi-tenant managed hosting by SWD

## 4. Functional requirements

1. Connector must reject calls missing `actor_role` or `correlation_id`.
2. Connector must resolve targets from server-side allowlist only.
3. Connector must block non-allowlisted operations.
4. Connector must block writes unless rollout flag enables them.
5. Connector must append an audit row for every call result (`OK` or `ERROR`).
6. Connector must enforce metadata-only write policy for `Execution Inbox` unless explicitly widened by config.

## 5. Non-functional requirements

- Reliability: deterministic policy enforcement before external side effects
- Security: certificate auth preferred; secret fallback only
- Auditability: request hash and correlation tracking for every call
- Operability: env + allowlist JSON config, docker-packable artifact

## 6. Deployment model

Primary (GA):
- Customer-hosted in customer Azure tenant (Container App or Azure Functions)

Deferred:
- SWD-managed multi-tenant deployment

## 7. Rollout phases

1. Read-oriented validation (2-3 days): `lists.query`, `lists.get`, `docs.link`
2. Write enablement for `Execution Inbox`
3. Expand to `Work Orders`, `Decision Log`, then document upload workflows

## 8. Success metrics

- 100% of accepted tool calls produce audit rows
- 0 policy-bypass incidents in beta
- <2% error rate for read operations under normal load
- Zero non-allowlisted target access attempts succeeding
