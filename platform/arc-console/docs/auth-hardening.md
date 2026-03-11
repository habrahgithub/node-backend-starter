# Auth Hardening

## Scope
Phase 5 hardening for local operator authentication.

## Implemented Controls

### Credential bootstrap policy
- Credentials and session secret are sourced from environment variables.
- Default credentials are detectable.
- `ARC_ALLOW_DEFAULT_CREDENTIALS` controls whether defaults are accepted.
  - default: `true` in development, `false` in production.

### Session expiry and rotation
- Session cookie TTL enforced by `ARC_SESSION_TTL_SECONDS`.
- Active signing secret:
  - `ARC_SESSION_SECRET`
- Verification supports previous secrets for rotation window:
  - `ARC_SESSION_PREVIOUS_SECRETS` (comma-separated)

### Failed-login rate handling
- In-memory rate controls:
  - `ARC_AUTH_RATE_WINDOW_MS`
  - `ARC_AUTH_MAX_ATTEMPTS`
  - `ARC_AUTH_BLOCK_SECONDS`
- On threshold breach, login returns:
  - HTTP `429`
  - `retryAfterSeconds`

### Auth audit coverage
- Login success/failure/rate-limit events are emitted as audit events.
- Session-missing and logout events are audited.
- Events are visible via `/api/logs` observability stream.

## Security Guardrails
- No password/cookie/token values are logged.
- Session cookie is HttpOnly and SameSite=Lax.
- Secure cookie flag is applied in production mode.

## Remaining Gaps
- No MFA or SSO
- No persistent auth event store
- No distributed rate limiter (single-process in-memory only)

## Next Hardening Steps
- Add account lock policy and backoff strategy.
- Add secret-source integration (vault-backed env bootstrap).
- Add security alerting for repeated auth failures.
