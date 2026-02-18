---
name: docsmith-licensing-ops
description: Operate and troubleshoot the DocSmith licensing service, including issue, validate, revoke, claim, offline token policy, and checkout bootstrap flows. Use when working in projects/docsmith-licensing-service for incidents, migrations, and release readiness.
---

# DocSmith Licensing Ops

## Scope

Operate `projects/docsmith-licensing-service`.

## Fast Path

1. Run `npm run test:issue-concurrency`.
2. Run `npm run build`.
3. Verify `GET /api/health` after deployment.

## API Coverage

Validate behavior for:
- `POST /api/licenses/issue`
- `POST /api/entitlements/issue`
- `POST /api/licenses/validate`
- `POST /api/licenses/revoke`
- `POST /api/licenses/claim/redeem`
- `POST /v1/checkout/session`

## Migration and Data Ops

1. Export `DATABASE_URL`.
2. Apply migrations in `db/migrations/` in chronological order.
3. Run periodic cleanup SQL from `scripts/cleanup_checkout_tables.sql`.

## Required Inputs

- `DATABASE_URL`
- `LICENSING_API_TOKEN`
- `OFFLINE_TOKEN_PRIVATE_KEY`

## Guardrails

- Keep invalid validation response uniform: `{ "valid": false }`.
- Enforce RS256 token policy in production.
- Protect strict device-limit enforcement across plan tiers.
