# Sandbox Provisioning

- Directive: CHORE-20260226-SEC-SANDBOX-001
- Add-on: CHORE-20260226-SEC-DRILL-RUNNER-002
- Timestamp (UTC): 2026-02-26 02:51:18Z
- Railway Project: DocSmith-SANDBOX (607305de-2e22-4d45-9119-08f9e6bcd18a)

## Services
- gateway-sandbox (73155387-6b65-47ea-ab47-fdb6b9209138)
- licensing-sandbox (d22147b9-5cff-4bd8-b272-0e60b1bef612)
- postgres service (0da65341-80f9-4e93-ba8b-454317508546, template default name: Postgres)

## URLs
- Gateway: https://gateway-sandbox-production.up.railway.app
- Licensing: https://licensing-sandbox-production.up.railway.app

## Deploy Baseline
- gateway baseline SHA requested: 37ad6e2
- licensing baseline SHA requested: 58a9011

## Sandbox Hardening Deploys
- gateway hardening commit: ed35366
- licensing hardening commit: e76f407

## Databases
- docsmith_gateway_sandbox
- docsmith_licensing_sandbox
- No production data copied.

## Notes
- Railway template created postgres service with default name "Postgres".
- Sandbox isolation enforced through separate project + separate databases + sandbox-only secrets.
