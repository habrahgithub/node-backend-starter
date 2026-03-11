# Pulse Phase 1 Read-Only Connector Contract

## Scope

Phase 1 connector is read-only. Pulse consumes Vault governance signals and must not mutate Vault state.

## Non-Goals

1. No write-back from Pulse to Vault.
2. No schema rewrites.
3. No raw content replication outside required summaries/signals.

## Data Sources (Vault)

Primary table:

1. `events`

## Required Signals

1. Latest ingest health:
   - format coverage counters and rates,
   - anomaly flags.
2. Backup freshness and restore verification status:
   - last backup timestamp,
   - last restore/verify outcomes.
3. Security/system warnings:
   - `type=system` warning/critical/fatal rows,
   - counter-contract warnings.

## Suggested Query Contract

All queries are read-only and bounded.

### 1) Latest Ingest Summary

```sql
SELECT id, ts, severity, summary, details_json
FROM events
WHERE type = 'ingest_summary'
ORDER BY id DESC
LIMIT 1;
```

### 2) Backup + Restore Recency

```sql
SELECT type, ts, severity, summary, details_json
FROM events
WHERE type IN ('backup', 'restore', 'verify')
ORDER BY id DESC
LIMIT 20;
```

### 3) Security/System Warning Window

```sql
SELECT id, ts, type, project, severity, summary, details_json
FROM events
WHERE type IN ('system', 'security')
  AND LOWER(severity) IN ('warning', 'critical', 'fatal', 'warn', 'blocker')
ORDER BY id DESC
LIMIT 100;
```

## Required Normalization in Pulse

1. Normalize severity aliases:
   - `warn -> warning`
   - `blocker -> critical`
2. Treat event ordering by `id` as authoritative for recency.
3. Preserve raw JSON fields for provenance/audit traces.

## Risk Gates

Pulse must mark connector status degraded if any of these hold:

1. Chain verification signal indicates failure.
2. Backup freshness exceeds policy threshold.
3. Restore drill missing beyond policy window.
4. Counter-contract warning events appear in recent ingest window.

## Security Constraints

1. Connector credentials are read-only.
2. No secrets from Vault details are logged by Pulse.
3. Host fingerprint is treated as operational metadata only.

## Versioning

Connector must display:

1. `VAULT_SCHEMA_VERSION`
2. `VAULT_BUILD_ID`

and persist both values with each Pulse observation snapshot.
