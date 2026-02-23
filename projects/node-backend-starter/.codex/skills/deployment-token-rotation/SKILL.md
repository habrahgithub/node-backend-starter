---
name: deployment-token-rotation
description: Manually rotate deployment tokens/secrets in Vercel and Railway environments. Use when the user asks to cycle or rotate API tokens, replace compromised secrets, or perform key rollover for deployed services.
---

# Deployment Token Rotation

## Overview

Rotate environment tokens in deployed services with explicit manual confirmation.

## Manual Trigger Rule

Only run rotation when the user explicitly asks for it in the current turn.
Default to dry-run previews and require explicit apply confirmation.

## Preflight

1. Confirm target provider: `vercel` or `railway`.
2. Confirm target environment and variable name.
3. Confirm source for new secret value (`env var` or secure input path).
4. Confirm rollback path (previous value retained in secret manager).

## Vercel Rotation

Use `scripts/rotate_vercel_env_token.sh`.

Example dry-run:
```bash
./scripts/rotate_vercel_env_token.sh \
  --project /path/to/project \
  --token-name PAYMENT_GATEWAY_API_TOKEN \
  --environment production \
  --value-env NEW_PAYMENT_GATEWAY_API_TOKEN
```

Apply:
```bash
./scripts/rotate_vercel_env_token.sh \
  --project /path/to/project \
  --token-name PAYMENT_GATEWAY_API_TOKEN \
  --environment production \
  --value-env NEW_PAYMENT_GATEWAY_API_TOKEN \
  --apply
```

## Railway Rotation

Use `scripts/rotate_railway_env_token.sh`.

Service variable dry-run:
```bash
./scripts/rotate_railway_env_token.sh \
  --project /path/to/project \
  --service-name docsmith-payment-gateway \
  --variable PAYMENT_GATEWAY_API_TOKEN \
  --value-env NEW_PAYMENT_GATEWAY_API_TOKEN
```

Service variable apply:
```bash
./scripts/rotate_railway_env_token.sh \
  --project /path/to/project \
  --service-name docsmith-payment-gateway \
  --variable PAYMENT_GATEWAY_API_TOKEN \
  --value-env NEW_PAYMENT_GATEWAY_API_TOKEN \
  --apply
```

Shared variable apply:
```bash
./scripts/rotate_railway_env_token.sh \
  --project /path/to/project \
  --shared \
  --variable LICENSING_API_TOKEN \
  --value-env NEW_LICENSING_API_TOKEN \
  --apply
```

## Verification

1. Verify variable is present in provider config.
2. Run service health endpoint checks.
3. Trigger one safe integration call that uses the rotated token.
4. Monitor logs and metrics for authentication failures.

## Rollback

1. Re-run the same script with previous known-good token value.
2. Re-check health and token-protected endpoints.

## Resources

- `references/commands.md` for command notes and guardrails.
- `scripts/rotate_vercel_env_token.sh` for Vercel env token rotation.
- `scripts/rotate_railway_env_token.sh` for Railway env token rotation.
