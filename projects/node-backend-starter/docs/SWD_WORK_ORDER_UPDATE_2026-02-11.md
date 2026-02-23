# SWD Work Order Update

- Date: 2026-02-11
- Prepared by: Forge

## Forge Work Orders

- WO-2026-02-11-FORGE-REVENUE-PATH
- Status: In Progress (blocked)
- Completed:
  - Gateway payment intent flow verified live.
  - Ziina webhook registered to production endpoint.
  - Signed webhook persistence verified (`webhook_events` insert).
  - Worker execution verified with deterministic error capture.
- Blocker:
  - Licensing issue endpoint returns `401`; token mismatch at runtime.
- Acceptance criteria:
  - Worker processes paid webhook with `processed=true`.
  - Licensing creates license row for paid intent.
  - Gateway payment status updates to paid/issued.

- WO-2026-02-11-FORGE-OFFLINE-TOKEN
- Status: Completed (service-side hardening), Pending extension integration
- Completed:
  - Offline token issuance guardrails (input caps, rate limiting, audit events).
  - RS256 production-safe token handling baseline in licensing service.
- Remaining:
  - Extension MV3 integration using offline token verify + refresh logic.

## Habib Action Work Orders

- WO-2026-02-11-HABIB-TOKEN-ALIGNMENT
- Priority: P0
- Action:
  - Set one fresh value for `LICENSING_API_TOKEN` in:
    - Railway `docsmith-licensing-service`
    - Vercel `docsmith-payment-gateway`
  - Redeploy both services.
- Acceptance criteria:
  - Direct call to licensing `/api/licenses/issue` returns auth pass (`400/422` or success, not `401`) with valid header format.

- WO-2026-02-11-HABIB-PROD-REPLAY
- Priority: P0
- Action:
  - Run gateway worker once to replay queued paid webhooks.
  - Validate DB states across gateway and licensing.
- Acceptance criteria:
  - `webhook_events.processed=true` for queued paid event.
  - `payments` reflects issued/paid state.
  - `licenses` row exists and validates.

- WO-2026-02-11-HABIB-POST-RECOVERY-E2E
- Priority: P1
- Action:
  - Execute one fresh low-value live payment and verify full chain.
- Acceptance criteria:
  - Payment captured, webhook persisted, worker processed, license issued, validate endpoint returns `valid:true` for allowed device count.
