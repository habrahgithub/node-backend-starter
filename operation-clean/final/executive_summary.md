# Executive Summary

## Workspace Overview
- Scoped workspace root: `/home/habib/workspace`
- Total projects identified: 16
- Analysis is read-only for project content and writes only into `operation-clean/`.

## Tech Stack Summary
- Next.js: 9 projects
- React: 9 projects
- Express: 4 projects
- Playwright: 3 projects
- Mongoose: 2 projects
- Prisma: 1 projects

## Top Structural Risks
- R001: Archived packages remain in workspace scope
- R002: Potential duplicated starter lineage
- R003: Missing or unclear automated test coverage
- R004: Missing or partial project documentation
- R005: Infrastructure maturity gaps

## Top Duplication Findings
- projects/node-backend-starter vs projects/node-backend-starter-v2: same inferred type; shared runtime dependencies; starter naming overlap
- projects/SWD-ARC/apps/controls-center vs projects/swd-docsmith_brand-website: same inferred type; shared runtime dependencies; name prefix overlap
- projects/SWD-ARC/apps/controls-center vs projects/swd-landing: same inferred type; shared runtime dependencies; name prefix overlap
- projects/SWD-ARC/apps/controls-center vs vault/dashboard: same inferred type; shared runtime dependencies; name prefix overlap
- projects/SWD-ARC/mcp/server vs projects/swd-finstack/mcp/server: same inferred type; shared runtime dependencies; name prefix overlap

## Priority Distribution
- P0: 3
- P1: 4
- P2: 4
- P3: 3
- P4: 2

## Status Distribution
- ACTIVE: 11
- ARCHIVE: 2
- TEMPLATE: 3

## Recommended Target Architecture
- platform / services / applications / extensions / templates / tooling / research / archive / docs

## Top 10 Remediation Actions
- OC-001 Resolve starter duplication (projects/node-backend-starter*) — Decide canonical starter and archive or differentiate the other
- OC-002 Review archived project retention (projects/_archive) — Confirm retention policy and cold-storage boundary
- OC-003 Improve missing test coverage (multiple) — Add minimal smoke/unit coverage per active project
- OC-004 Normalize naming conventions (multiple) — Adopt lowercase-hyphenated names in future move plan
- OC-005 Document service ownership (multiple) — Add owner/purpose/runbook section per active project

## Items Requiring Prime Approval
- OC-001 Resolve starter duplication
- OC-002 Review archived project retention
- OC-004 Normalize naming conventions

## Confidence and Limitations
- Confidence: MEDIUM.
- Limitations: priority/status are heuristic; filesystem metadata recency was not deeply scored; some projects remain ASSUMED or NEEDS_REVIEW where evidence is thin.
