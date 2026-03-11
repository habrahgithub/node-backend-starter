# Classification Report v2

## Reconstruction Scope
- Source of truth: validated discovery artifacts under `operation-clean/discovery/`.
- Additional references: audit findings under `operation-clean/audit/` plus prior invalid classification/planning outputs only as contrast material.
- Workspace remained read-only except for new `_v2` artifacts under `operation-clean/`.

## Corrections Applied After Audit
- Reclassified `docsmith-licensing-service` and `docsmith-payment-gateway` as `service` and targeted them to `services/` rather than `docs/`.
- Replaced duplicate project identities with role-based names: `workspace-root-orchestrator`, `swd-arc-controls-center`, `swd-arc-mcp-server`, `swd-mcp-server-archive-copy`, and `vault-dashboard-legacy`.
- Removed unsafe generic move targets such as `templates/files` and `tooling/server` in favor of unique normalized paths.
- Marked thin-evidence items conservatively: `swd-finstack-mcp-server` is `EXPERIMENT` with `tests_present=no`, and `wps-hr-core` remains `EXPERIMENT` pending stronger documentation.
- Preserved all archive items as retained references; no deletion recommendation is made in v2.

## Duplicate Resolution Logic
- `swd-pulse`: split into `workspace-root-orchestrator` for the workspace root and `node-backend-starter` for the template project, because the path/README identity for the starter was clearer than its package name.
- `swd-vault-dashboard`: treated `projects/SWD-ARC/apps/controls-center` as the primary active control-plane surface and `vault/dashboard` as a legacy standalone War Room surface pending approved consolidation.
- `swd-mcp-server`: treated `projects/SWD-ARC/mcp/server` as the active tooling project and the `_archive` copy as an archive reference only.
- Potential duplication is only called actionable where purpose and structure align strongly. The clearest candidate remains the starter lineage (`node-backend-starter` vs `node-backend-starter-v2`).

## Summary Counts
- Projects classified: 16
- Project types: application=3, archive=2, extension=1, platform=3, service=2, template=3, tooling=2
- Statuses: ACTIVE=3, ARCHIVE=2, EXPERIMENT=3, LEGACY=1, STABLE=5, TEMPLATE=2
- Priorities: P0=2, P1=3, P2=3, P3=5, P4=3

## Move Plan Reasoning
- `platform/`, `services/`, `applications/`, `tooling/`, `extensions/`, `templates/`, and `archive/` are now cleanly separated at the planning layer.
- Every proposed path is unique; collision check is `PASS` for all 16 rows in `move_plan_v2.csv`.
- High-risk live runtimes remain `review_before_move` or `review_for_consolidation`; templates and archive references are the only low/medium-risk normalization candidates.
- No move recommendation implies deletion, merge, or archive execution without Prime approval.

## Risk Evaluation
- Highest planning risk remains the platform/dashboard overlap (`swd-arc-controls-center` vs `vault-dashboard-legacy`).
- Highest classification risk remains any attempt to treat the workspace root as a deployable service.
- Moderate risk remains around starter lineage decisions and any future move of live services because deployment references would need a dedicated dependency sweep.

## Project Classifications
### workspace-root-orchestrator
- current_path: `.`
- project_type: platform
- priority: P0
- status: ACTIVE
- language: JavaScript/TypeScript
- framework: Express, Mongoose
- tests_present: yes
- docs_present: no
- owner: unknown
- dependencies_summary: @vercel/speed-insights, express, mongoose, ollama
- target_group: platform
- recommended_action: review_before_move
- confidence: MEDIUM
- rationale: Workspace root contains orchestrator-level checkup scripts across child projects and should be treated as platform coordination, not as a standalone deployable service.
- evidence_paths: package.json; test/app.test.js; test/integration.test.js

### arc-axis-adapter
- current_path: `projects/SWD-ARC/Lab Template/files`
- project_type: template
- priority: P3
- status: TEMPLATE
- language: JavaScript/TypeScript
- framework: Express
- tests_present: yes
- docs_present: yes
- owner: unknown
- dependencies_summary: express, openai
- target_group: templates
- recommended_action: propose_move
- confidence: HIGH
- rationale: Package metadata, README, and explicit adapter test file mark this as a reusable lab template rather than an active runtime.
- evidence_paths: projects/SWD-ARC/Lab Template/files/package.json; projects/SWD-ARC/Lab Template/files/README.md; projects/SWD-ARC/Lab Template/files/tests/adapter.test.js

### swd-arc-controls-center
- current_path: `projects/SWD-ARC/apps/controls-center`
- project_type: platform
- priority: P0
- status: ACTIVE
- language: JavaScript/TypeScript
- framework: Next.js, React
- tests_present: yes
- docs_present: yes
- owner: unknown
- dependencies_summary: better-sqlite3, next, react, react-dom, playwright
- target_group: platform
- recommended_action: review_before_move
- confidence: MEDIUM
- rationale: README positions this as the ARC control plane with embedded War Room capabilities, which makes it a core platform surface. Identity renamed from `swd-vault-dashboard` to avoid collision with the standalone legacy dashboard.
- evidence_paths: projects/SWD-ARC/apps/controls-center/package.json; projects/SWD-ARC/apps/controls-center/README.md; projects/SWD-ARC/apps/controls-center/scripts/axis-hard-gate-regression.mjs

### swd-arc-mcp-server
- current_path: `projects/SWD-ARC/mcp/server`
- project_type: tooling
- priority: P3
- status: STABLE
- language: JavaScript/TypeScript
- framework: MCP SDK
- tests_present: yes
- docs_present: yes
- owner: unknown
- dependencies_summary: @modelcontextprotocol/sdk, better-sqlite3
- target_group: tooling
- recommended_action: review_before_move
- confidence: HIGH
- rationale: Active MCP server with explicit tests and documentation; renamed to distinguish it from the archived absorbed copy.
- evidence_paths: projects/SWD-ARC/mcp/server/package.json; projects/SWD-ARC/mcp/server/README.md; projects/SWD-ARC/mcp/server/tests/server.test.js

### swd-mcp-server-archive-copy
- current_path: `projects/_archive/2026-03-03-workspace-reorg/absorbed-projects/SWD-mcp-server`
- project_type: archive
- priority: P4
- status: ARCHIVE
- language: JavaScript/TypeScript
- framework: MCP SDK
- tests_present: yes
- docs_present: yes
- owner: unknown
- dependencies_summary: @modelcontextprotocol/sdk, better-sqlite3
- target_group: archive
- recommended_action: retain_archive
- confidence: HIGH
- rationale: Archive path is explicit and contents mirror the active MCP server, so it is treated as a retained archive reference rather than an active duplicate target.
- evidence_paths: projects/_archive/2026-03-03-workspace-reorg/absorbed-projects/SWD-mcp-server/package.json; projects/_archive/2026-03-03-workspace-reorg/absorbed-projects/SWD-mcp-server/README.md

### wps-sif-tool-archive
- current_path: `projects/_archive/2026-03-03-workspace-reorg/user-requested/wps-sif-tool`
- project_type: archive
- priority: P4
- status: ARCHIVE
- language: JavaScript/TypeScript
- framework: Next.js, React, Vite, Playwright
- tests_present: yes
- docs_present: yes
- owner: unknown
- dependencies_summary: decimal.js, next, papaparse, react, react-dom, xlsx, zod
- target_group: archive
- recommended_action: retain_archive
- confidence: HIGH
- rationale: Archive path is explicit; scripts and dependencies suggest lineage related to the active DocSmith extension but not a candidate for unapproved deletion.
- evidence_paths: projects/_archive/2026-03-03-workspace-reorg/user-requested/wps-sif-tool/package.json; projects/_archive/2026-03-03-workspace-reorg/user-requested/wps-sif-tool/README.md; projects/_archive/2026-03-03-workspace-reorg/user-requested/wps-sif-tool/__tests__/page.test.js

### docsmith-licensing-service
- current_path: `projects/docsmith-licensing-service`
- project_type: service
- priority: P1
- status: STABLE
- language: JavaScript/TypeScript
- framework: Next.js, React
- tests_present: yes
- docs_present: yes
- owner: unknown
- dependencies_summary: @azure/identity, @microsoft/microsoft-graph-client, next, pg, react, react-dom
- target_group: services
- recommended_action: review_before_move
- confidence: HIGH
- rationale: Validated audit correction: this is a live licensing service with API endpoints, migrations, and operational scripts, not documentation.
- evidence_paths: projects/docsmith-licensing-service/package.json; projects/docsmith-licensing-service/README.md; projects/docsmith-licensing-service/app/api; projects/docsmith-licensing-service/db/migrations

### docsmith-payment-gateway
- current_path: `projects/docsmith-payment-gateway`
- project_type: service
- priority: P1
- status: STABLE
- language: JavaScript/TypeScript
- framework: Next.js, React
- tests_present: yes
- docs_present: yes
- owner: unknown
- dependencies_summary: next, pg, react, react-dom
- target_group: services
- recommended_action: review_before_move
- confidence: HIGH
- rationale: Validated audit correction: this is a live payment-processing service with webhook handling and delivery flows, not documentation.
- evidence_paths: projects/docsmith-payment-gateway/package.json; projects/docsmith-payment-gateway/README.md; projects/docsmith-payment-gateway/app/api; projects/docsmith-payment-gateway/db/migrations

### node-backend-starter
- current_path: `projects/node-backend-starter`
- project_type: template
- priority: P3
- status: TEMPLATE
- language: JavaScript/TypeScript
- framework: Express, Mongoose
- tests_present: yes
- docs_present: yes
- owner: unknown
- dependencies_summary: @vercel/speed-insights, express, mongoose, supertest
- target_group: templates
- recommended_action: propose_move
- confidence: MEDIUM
- rationale: README clearly identifies this as a backend starter. The package name collision with the workspace root was resolved in favor of the path/README identity.
- evidence_paths: projects/node-backend-starter/package.json; projects/node-backend-starter/README.md; projects/node-backend-starter/test/security.test.js

### node-backend-starter-v2
- current_path: `projects/node-backend-starter-v2`
- project_type: template
- priority: P3
- status: EXPERIMENT
- language: JavaScript/TypeScript
- framework: Express, Prisma
- tests_present: yes
- docs_present: yes
- owner: unknown
- dependencies_summary: @prisma/client, express, prisma, swagger-ui-express, zod
- target_group: templates
- recommended_action: review_before_move
- confidence: HIGH
- rationale: Package metadata and README establish a TypeScript/OpenAPI backend starter. Release-candidate wording justifies `EXPERIMENT` status rather than `STABLE`.
- evidence_paths: projects/node-backend-starter-v2/package.json; projects/node-backend-starter-v2/README.md; projects/node-backend-starter-v2/SUMMARY.md; projects/node-backend-starter-v2/tests/unit/user.service.test.ts

### swd-docsmith-sif-extension
- current_path: `projects/swd-docsmith-sif-extension`
- project_type: extension
- priority: P1
- status: STABLE
- language: JavaScript/TypeScript
- framework: Next.js, React, Vite, Playwright
- tests_present: yes
- docs_present: yes
- owner: unknown
- dependencies_summary: decimal.js, next, papaparse, react, react-dom, react-window, xlsx, zod
- target_group: extensions
- recommended_action: review_before_move
- confidence: HIGH
- rationale: README and build scripts define a production browser extension tied to the licensing and payment services; this is not a general web application.
- evidence_paths: projects/swd-docsmith-sif-extension/package.json; projects/swd-docsmith-sif-extension/README.md; projects/swd-docsmith-sif-extension/__tests__/license.test.js

### swd-docsmith-brand-website
- current_path: `projects/swd-docsmith_brand-website`
- project_type: application
- priority: P2
- status: ACTIVE
- language: JavaScript/TypeScript
- framework: Next.js, React, Playwright
- tests_present: yes
- docs_present: yes
- owner: unknown
- dependencies_summary: @vercel/analytics, @vercel/sandbox, next, pg, react, react-dom
- target_group: applications
- recommended_action: propose_move
- confidence: HIGH
- rationale: This is an active Next.js website/application. Proposed target normalizes the current underscore separator to the workspace naming standard.
- evidence_paths: projects/swd-docsmith_brand-website/package.json; projects/swd-docsmith_brand-website/README.md; projects/swd-docsmith_brand-website/__tests__/validation.test.js

### swd-finstack-mcp-server
- current_path: `projects/swd-finstack/mcp/server`
- project_type: tooling
- priority: P3
- status: EXPERIMENT
- language: JavaScript/TypeScript
- framework: MCP SDK
- tests_present: no
- docs_present: no
- owner: unknown
- dependencies_summary: @modelcontextprotocol/sdk, axios, dotenv, winston
- target_group: tooling
- recommended_action: review_before_move
- confidence: MEDIUM
- rationale: Tooling identity is clear from path and package metadata, but missing README and thin test evidence require a conservative `EXPERIMENT` status.
- evidence_paths: projects/swd-finstack/mcp/server/package.json; projects/swd-finstack/mcp/server/server.js

### swd-landing
- current_path: `projects/swd-landing`
- project_type: application
- priority: P2
- status: STABLE
- language: JavaScript/TypeScript
- framework: Next.js, React
- tests_present: yes
- docs_present: yes
- owner: unknown
- dependencies_summary: @fontsource/inter, framer-motion, next, react, react-dom
- target_group: applications
- recommended_action: review_before_move
- confidence: HIGH
- rationale: Active, documented Next.js website/application with tests and clear product-facing purpose.
- evidence_paths: projects/swd-landing/package.json; projects/swd-landing/README.md; projects/swd-landing/__tests__/smoke.test.js

### wps-hr-core
- current_path: `projects/wps-hr-core`
- project_type: application
- priority: P2
- status: EXPERIMENT
- language: JavaScript/TypeScript
- framework: Next.js, React
- tests_present: yes
- docs_present: yes
- owner: unknown
- dependencies_summary: next, react, react-dom
- target_group: applications
- recommended_action: review_before_move
- confidence: MEDIUM
- rationale: Next.js app structure and dedicated tests support application classification, but the boilerplate README leaves maturity and ownership unclear, so status remains conservative.
- evidence_paths: projects/wps-hr-core/package.json; projects/wps-hr-core/README.md; projects/wps-hr-core/tests/eosb.test.ts; projects/wps-hr-core/src/app

### vault-dashboard-legacy
- current_path: `vault/dashboard`
- project_type: platform
- priority: P4
- status: LEGACY
- language: JavaScript/TypeScript
- framework: Next.js, React
- tests_present: no
- docs_present: yes
- owner: unknown
- dependencies_summary: better-sqlite3, next, react, react-dom
- target_group: platform
- recommended_action: review_for_consolidation
- confidence: MEDIUM
- rationale: README and package scope overlap heavily with the ARC Controls Center/War Room surface, but no approved consolidation exists. Classified as legacy platform surface to avoid duplicate active identity.
- evidence_paths: vault/dashboard/package.json; vault/dashboard/README.md
