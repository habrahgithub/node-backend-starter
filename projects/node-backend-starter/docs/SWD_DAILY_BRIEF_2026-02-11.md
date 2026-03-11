# SWD Daily Brief

- Date: 2026-02-11
- Prepared by: Forge
- Focus: Payment gateway and licensing production path

## Executive status

- DNS and public routing are operational for buy gateway.
- Ziina payment flow is operational through checkout.
- Webhook ingestion path is operational after webhook registration and signed event test.
- Revenue automation is blocked at licensing issuance auth (`401` from licensing service).

## What was completed

- Verified payment intent creation endpoint and DB persistence.
- Confirmed provider-side completed payment intent exists.
- Registered Ziina webhook to gateway production endpoint.
- Posted a signed backfill webhook successfully; event stored in `webhook_events`.
- Ran worker once and captured deterministic failure (`Licensing issue failed (401)`).
- Isolated blocker to licensing token acceptance (runtime env mismatch suspected).

## Current blocker

- Shared `LICENSING_API_TOKEN` is not matching at runtime between:
  - Vercel `docsmith-payment-gateway`
  - Railway `docsmith-licensing-service`

## Next 24h priorities

1. Rotate and align `LICENSING_API_TOKEN` in both platforms.
2. Redeploy both services.
3. Replay queued webhook event with worker `--once`.
4. Verify license issuance row exists in licensing DB.
5. Run one end-to-end paid transaction to validate full automation.

## Risks

- Paid customer can complete payment but license issuance can fail until auth is corrected.
- Backlog of unprocessed paid webhooks may grow while auth mismatch persists.

## Decision log (today)

- Keep webhook handler persistence-only (no business logic in webhook route).
- Process business logic in worker with retry and idempotency.
- Treat licensing auth mismatch as highest-priority production blocker.
