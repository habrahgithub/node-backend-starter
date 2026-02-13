# MCP Server Connector Prototype Implementation Plan

This runbook defines a phased rollout to ship a workable MCP Server Connector with controlled risk.

## Phase 0: Foundation and Safety Baseline

Goals:
- Keep connector startup gated by existing policy controls (`MCP_DISABLED`, allowlist validation, read-only defaults).
- Keep stdio transport as the known-good default.

Execution:
- Lock required env/config validation before any transport starts.
- Verify startup logs expose phase mode, write gate status, and audit mode.
- Keep failure mode explicit (`process.exit(78)` when disabled).

Exit criteria:
- Connector starts deterministically in local and CI environments.
- Misconfiguration errors are explicit and actionable.

## Phase 1: Streamable HTTP Runtime Prototype

Goals:
- Add `MCP_TRANSPORT=http` mode while preserving `stdio` compatibility.
- Expose one configurable endpoint (`MCP_HTTP_HOST`, `MCP_HTTP_PORT`, `MCP_HTTP_PATH`).

Execution:
- Add route matching for `MCP_HTTP_PATH`.
- Accept only `POST` on the configured path.
- Require `application/json` content-type for `POST`.
- Parse JSON safely and return structured error payloads for request validation failures.
- Wire requests into MCP SDK `StreamableHTTPServerTransport`.

Exit criteria:
- Connector boots in both `stdio` and `http` modes.
- Local smoke test confirms endpoint behavior and startup logging.

## Phase 2: Validation and Automated Coverage

Goals:
- Add automated coverage for HTTP request validation branches.
- Keep regressions visible before deployment.

Execution:
- Add tests for:
  - path mismatch (`404`)
  - unsupported method (`405`)
  - wrong content-type (`415`)
  - malformed JSON (`400`)
- Run tests in CI and local workflows with deterministic env setup.

Exit criteria:
- Test suite passes reliably.
- HTTP validation failures are covered and documented.

## Phase 3: Controlled Deployment and Client Integration

Goals:
- Enable connector in customer-facing environments behind approved network controls.
- Integrate with MCP clients using the configured HTTP endpoint.

Execution:
- Deploy with `MCP_TRANSPORT=http` and constrained host/path settings.
- Maintain read-only tool phase until operations sign-off for write enablement.
- Validate request/response handling, audit logs, and policy enforcement under real traffic.

Exit criteria:
- Endpoint reachable only through approved boundary.
- Operational checks pass for stability and auditability.

## Phase 4: Production Hardening

Goals:
- Convert prototype into production-grade service posture.
- Formalize rollback and incident handling for transport/runtime faults.

Execution:
- Add alerting on startup failures, validation spikes, and request error rates.
- Add deployment rollback steps for transport/path config regressions.
- Validate production defaults for token role enforcement and audit strictness.

Exit criteria:
- Change management, rollback, and on-call procedures are documented.
- Production posture approved by security and platform owners.
