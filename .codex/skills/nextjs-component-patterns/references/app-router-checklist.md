# App Router Checklist

## Component Boundaries

- Server component by default.
- `use client` added only where required.
- No server-only secrets in client bundles.

## Routing

- Route segment structure is clear and intentional.
- `loading` and `error` states exist where needed.
- Metadata and canonical URL behavior are verified.

## Data and API

- Request validation is explicit.
- Error responses are consistent.
- Sensitive endpoints require authentication/authorization.

## Release Readiness

- Build passes.
- Critical route smoke tests pass.
- No unexpected hydration warnings.
