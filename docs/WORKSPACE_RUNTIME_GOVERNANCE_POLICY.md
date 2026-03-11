# Workspace Runtime Governance Policy

Version: v1.0
Status: Active
Effective Date: 2026-02-20
Owner: SWD Operations

## Purpose

Prevent cross-repo runtime divergence that breaks deterministic test and release protocols.

## Runtime Baseline

- Canonical Node runtime: `20.11.1`
- Minimum allowed Node runtime for Next.js surfaces: `>=20.9.0`
- Runtime pins must use `.nvmrc` in:
  - workspace root (`.nvmrc`)
  - `vault/dashboard/.nvmrc`

## Mandatory Contracts

1. `vault/dashboard/package.json` must include:
   - `"engines": { "node": ">=20.9.0" }`
2. Root `checkup:run` must execute runtime gate before project checks.
3. Runtime contract check must pass before release check can be GREEN.

## Enforcement

Command:

```bash
npm run checkup:runtime
```

Current implementation:

- `tools/check-runtime-contract.sh`

The runtime check is expected to fail-closed when:

- active Node version is below contract
- required pin files are missing or out of contract
- dashboard engine contract is missing or weaker than baseline
- `.nvmrc` files drift to a different major version

## Change Control

Any runtime baseline change requires:

1. New entry in `docs/DECISIONS.md`
2. Update of `.nvmrc` pins and runtime docs
3. Rebuild of native dependencies where applicable (`better-sqlite3`)
4. Successful `checkup:runtime` and protocol re-run evidence

## Non-Goals

- No multi-runtime support in the same release lane
- No per-repo ad hoc runtime overrides in release mode
