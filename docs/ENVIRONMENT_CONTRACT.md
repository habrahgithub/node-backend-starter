# Environment Contract

Version: v1.0
Status: Active
Effective Date: 2026-02-20

## Purpose

Define minimum required environment variables for deterministic local operation and protocol execution.

## Scope

- Local-first SWD OS workspace execution
- Test protocol prerequisites
- Vault + dashboard operations

## Required Variables by Surface

## Root / Protocol Execution

- `PATH` must include active Node runtime from `.nvmrc`
- `HOME` must resolve to writable WSL user directory

## Vault Dashboard

- `VAULT_SCHEMA_VERSION` (recommended)
- `VAULT_BUILD_ID` (recommended)
- `VAULT_RUN_TOKEN` (required when API trigger hardening is enabled)

## Vault Backup/Restore

- `VAULT_BACKUP_PASSPHRASE` (required for encrypted backup/restore workflows)

## Payment Gateway E2E

- `GATEWAY_BASE_URL` (required by `projects/docsmith-payment-gateway` for `e2e:live`)

## Optional but Recommended

- `SWD_VAULT_RUN_PROFILE`
- `SWD_VAULT_CLI_VERSION`

## Contract Rules

1. Missing required vars for a protocol layer are release blockers for that layer.
2. Placeholder values are not valid in release mode.
3. Environment contract changes require:
   - `docs/DECISIONS.md` update
   - protocol re-run evidence

## Verification Checklist

1. Runtime check:

```bash
npm run checkup:runtime
```

2. Payment E2E prerequisite:

```bash
echo "$GATEWAY_BASE_URL"
```

3. Vault chain and backup readiness:

```bash
./swd-vault verify chain
./swd-vault backup --encrypt --dest ~/swd-backups/vault --rotate
```
