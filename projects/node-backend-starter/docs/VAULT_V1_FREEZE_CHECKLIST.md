# Vault v1.0 Freeze Checklist

## Purpose

Freeze the Vault core as a stable dependency before shifting primary focus to Pulse integration.

## Freeze Date

- Effective: 2026-02-20

## Invariants (Do Not Change Without New Decision Entry)

1. Event schema compatibility is additive-only.
2. Hash chain algorithm and canonicalization rules remain unchanged.
3. Dedupe semantics remain pipeline-level and ordered:
   - bundle SHA (zip),
   - file fingerprint,
   - record fingerprint.
4. Provenance fields for ingest summaries remain present:
   - `run_profile`,
   - `cli_version`,
   - `host_fingerprint`.
5. Backup/restore contract remains:
   - encrypted snapshot support,
   - rotation policy,
   - restore verification before success.
6. War Room core surfaces remain mandatory:
   - Status,
   - Timeline.

## Allowed Post-Freeze Changes

1. Additive event types.
2. Read-only dashboard additions.
3. New ingestion adapters that do not change existing event meaning.
4. Performance improvements with identical output semantics.

## Explicitly Not Allowed (Without Freeze Amendment)

1. Changing meaning of existing event fields.
2. Changing canonical hash payload composition.
3. Removing provenance fields from ingest summaries.
4. Weakening backup/restore verification requirements.

## Runtime Build Markers

War Room must expose:

1. `VAULT_SCHEMA_VERSION`
2. `VAULT_BUILD_ID`

These markers are required for operational forensics and support.

## Operational Gate Before Any Freeze Amendment

1. `./swd-vault verify chain`
2. `./swd-vault backup --encrypt --dest ~/swd-backups/vault --rotate`
3. `./swd-vault restore --from <latest>.sqlite.gpg --dry-run`
4. Append decision entry in `docs/DECISIONS.md` describing the amendment.
