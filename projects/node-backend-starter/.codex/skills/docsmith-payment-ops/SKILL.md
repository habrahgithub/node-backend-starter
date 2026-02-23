---
name: docsmith-payment-ops
description: Operate and troubleshoot the DocSmith payment gateway service, including Ziina webhooks, worker processing, migrations, and metrics. Use when working in projects/docsmith-payment-gateway for incidents, deploy checks, or payment-flow debugging.
---

# DocSmith Payment Ops

## Scope

Operate `projects/docsmith-payment-gateway`.

## Fast Path

1. Run `npm run test:worker-behavior`.
2. Run `npm run build`.
3. Run `npm run process:webhooks` when validating worker behavior.
4. Run `npm run check:licensing-auth` before release handoff.

## Migration and SQL Ops

1. Export `DATABASE_URL` from Railway.
2. Apply SQL migrations in order from `db/migrations/`.
3. Run health checks from `scripts/webhook_health_console.sql`.
4. Check backlog quickly:
   - `psql "$DATABASE_URL" -c "select count(*) as backlog from webhook_events where processed=false;"`

## Incident Triage

1. Verify `POST /api/webhooks/ziina` ingress first.
2. Verify worker progress and retry growth.
3. Verify licensing downstream calls using gateway auth token.
4. Inspect `GET /admin/webhook-metrics` with `ADMIN_METRICS_TOKEN`.

## Required Inputs

- `DATABASE_URL`
- `ZIINA_ACCESS_TOKEN`
- `ZIINA_WEBHOOK_SECRET`
- `PAYMENT_GATEWAY_API_TOKEN`
- `ADMIN_METRICS_TOKEN`
- `LICENSING_API_TOKEN`

## Guardrails

- Preserve idempotency behavior for webhook ingestion and processing.
- Keep migration order strict in production.
- Avoid exposing internal endpoints unless `E2E_ENABLED=true` for controlled tests.
