# SWD Vault Dashboard

Local Next.js War Room for SWD Vault.

Runtime baseline: Node `20.11.1` (minimum `>=20.9.0`).

## Run

```bash
cd vault/dashboard
nvm use
npm install
npm run dev
```

Default URL: `http://localhost:4010`

Optional API hardening:

```bash
export VAULT_RUN_TOKEN="replace-with-long-random-token"
```

Optional build markers shown in War Room footer:

```bash
export VAULT_SCHEMA_VERSION="1.0"
export VAULT_BUILD_ID="local-dev"
```

When `VAULT_RUN_TOKEN` is set, `POST /api/run-profiles` requires:

```text
X-VAULT-RUN-TOKEN: <token>
```

The `/run-profiles` UI triggers runs via a server action, so the token is not exposed in browser client code.

Pages:

- `/` Status (7-day totals, blockers, release color)
  - Includes integrity indicator (`Chain OK` / `BROKEN`) based on hash-chain verification.
  - Includes Vault Health metrics (integrity %, backup freshness, failures, chain height, duplicate suppression, seal recency).
  - Includes `Recent Critical Events` and `Ingestion Summary (Last 10 Runs)` panels.
  - Includes `Format Coverage (Latest Ingest)` for md/csv/html scanned+inserted+skipped counts, per-format insert/skip rates, and anomaly badges.
  - Includes provenance detail toggles (`run_profile`, `cli_version`, shortened `host_fingerprint`) for latest and last-10 ingests.
- `/timeline` Timeline (last 200 events + filters, including taxonomy class)
  - Shows optional provenance details for `ingest_summary`, `backup`, and `restore` events.
- `/runs` Captured command runs (exit code, duration, log path)
- `/decisions` Decision + ops sweep feed with tag filters
- `/blockers` Blockers grouped by fingerprint
- `/projects` Per-project readiness cards
- `/run-profiles` Local control page to trigger profile runs
- `/events/[id]` Event detail view (details + evidence)

Data access is server-side direct SQLite reads.

## Native Module ABI Recovery (better-sqlite3)

If `better-sqlite3` fails to load after a Node runtime change, rebuild in WSL with the pinned Node from `.nvmrc`:

```bash
cd vault/dashboard
source "$HOME/.nvm/nvm.sh"
nvm install
nvm use
rm -rf node_modules
npm ci
npm rebuild better-sqlite3 --build-from-source
node -e "require('better-sqlite3'); console.log('better-sqlite3 OK')"
npm run build
```
