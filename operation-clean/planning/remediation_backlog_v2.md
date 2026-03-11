# Remediation Backlog v2

This backlog is derived from the corrected v2 classification and move-planning pass. No item authorizes execution on its own.

## Critical

- ID: OCV2-001
- Title: Resolve platform dashboard authority
- Project: projects/SWD-ARC/apps/controls-center; vault/dashboard
- Severity: Critical
- Problem: Two platform surfaces cover overlapping War Room/control-center capabilities without an approved authority model.
- Evidence: Overlapping README scope, shared package identity in v1, and high-risk legacy classification in v2.
- Recommended Fix: Decide canonical platform UI, document the relationship, and approve any consolidation plan separately.
- Approval Required: yes

## High

- ID: OCV2-002
- Title: Clean up root versus starter identity collision
- Project: .; projects/node-backend-starter
- Severity: High
- Problem: The workspace root package name and starter package name both resolve to `swd-pulse`, which is unsafe for planning and governance reporting.
- Evidence: Root `package.json` and `projects/node-backend-starter/package.json` share the same package name.
- Recommended Fix: Approve a canonical identity scheme and update future governance artifacts to keep the root orchestrator separate from the starter template.
- Approval Required: yes

- ID: OCV2-003
- Title: Decide starter lineage strategy
- Project: projects/node-backend-starter; projects/node-backend-starter-v2
- Severity: High
- Problem: Two backend starter templates overlap in purpose but differ in stack maturity and release posture.
- Evidence: Both are backend starter templates; v2 adds TypeScript/OpenAPI/Prisma while v1 still carries the older identity collision.
- Recommended Fix: Choose whether to differentiate the two templates clearly or designate one as the preferred starter before any archive/removal conversation.
- Approval Required: yes

- ID: OCV2-004
- Title: Plan live-service path normalization safely
- Project: projects/docsmith-licensing-service; projects/docsmith-payment-gateway
- Severity: High
- Problem: The services are now correctly classified, but any physical path move would affect deployment, environment, and runtime references.
- Evidence: Both services expose APIs, migrations, and operational scripts; prior v1 planning placed them incorrectly under `docs/`.
- Recommended Fix: Run a dedicated dependency/reference sweep before any approved move into `services/`.
- Approval Required: yes

## Medium

- ID: OCV2-005
- Title: Add documentation and real test evidence for SWD Finstack MCP server
- Project: projects/swd-finstack/mcp/server
- Severity: Medium
- Problem: The project lacks README evidence and local test artifacts despite exposing a `test` script.
- Evidence: Package metadata and `server.js` exist, but audit sampling found no README and no local test files.
- Recommended Fix: Add a README, verify the test command against real test files, and document intended ownership/runtime.
- Approval Required: no

- ID: OCV2-006
- Title: Replace boilerplate README for WPS HR Core
- Project: projects/wps-hr-core
- Severity: Medium
- Problem: Application structure and tests exist, but the README is still generic scaffold text and does not confirm product maturity.
- Evidence: Next.js app structure under `src/app` and dedicated tests contrast with boilerplate README content.
- Recommended Fix: Document project purpose, ownership, runbook, and intended lifecycle before promoting the status beyond `EXPERIMENT`.
- Approval Required: no

- ID: OCV2-007
- Title: Document archive lineage explicitly
- Project: projects/_archive/2026-03-03-workspace-reorg/*
- Severity: Medium
- Problem: Archived references are safe to retain, but their relationship to active successors is not documented in one canonical place.
- Evidence: Archived MCP server and archived WPS SIF tool remain in workspace scope as retained references.
- Recommended Fix: Create or update archive lineage notes so future planning does not treat archive copies as active duplicates.
- Approval Required: no

## Low

- ID: OCV2-008
- Title: Normalize mixed separators in application paths
- Project: projects/swd-docsmith_brand-website
- Severity: Low
- Problem: The current path uses an underscore while the normalized workspace model prefers lowercase hyphenated names.
- Evidence: Current path `projects/swd-docsmith_brand-website`; proposed target `applications/swd-docsmith-brand-website`.
- Recommended Fix: If a move is later approved, normalize the path and update references in the same controlled change.
- Approval Required: yes
