# Classification Challenges

## 1. Workspace Root `.`
- project: `swd-pulse`
- original classification: `service`, `ACTIVE`, `P0`
- issue: The workspace root behaves as a monorepo/orchestration surface, not a clearly bounded standalone service. Test evidence at root is mixed with workspace-wide content, and there is no root README explaining this as the primary production service.
- evidence reviewed:
  - `/home/habib/workspace/package.json`
  - absence of `/home/habib/workspace/README.md`
  - root `checkup:*` scripts orchestrating child projects
- challenge level: HIGH
- recommended corrected classification or NEEDS_REVIEW: `NEEDS_REVIEW`; safer interim classification is workspace tooling/orchestrator rather than a deployable service.

## 2. `projects/docsmith-licensing-service`
- project: `docsmith-licensing-service`
- original classification: `type=docs`, `suggested_target_group=docs`
- issue: README and folder structure show a live Next.js licensing service with API endpoints, migrations, and operational scripts.
- evidence reviewed:
  - `/home/habib/workspace/projects/docsmith-licensing-service/package.json`
  - `/home/habib/workspace/projects/docsmith-licensing-service/README.md`
  - `/home/habib/workspace/projects/docsmith-licensing-service/app/api`
  - `/home/habib/workspace/projects/docsmith-licensing-service/db/migrations`
- challenge level: HIGH
- recommended corrected classification or NEEDS_REVIEW: `service` or `application/service`; target group should not be `docs`.

## 3. `projects/docsmith-payment-gateway`
- project: `docsmith-payment-gateway`
- original classification: `type=docs`, `suggested_target_group=docs`
- issue: README and layout show a live payment-processing service with webhook endpoints, migrations, and worker scripts.
- evidence reviewed:
  - `/home/habib/workspace/projects/docsmith-payment-gateway/package.json`
  - `/home/habib/workspace/projects/docsmith-payment-gateway/README.md`
  - `/home/habib/workspace/projects/docsmith-payment-gateway/app/api`
  - `/home/habib/workspace/projects/docsmith-payment-gateway/db/migrations`
- challenge level: HIGH
- recommended corrected classification or NEEDS_REVIEW: `service` or `application/service`; target group should not be `docs`.

## 4. `projects/node-backend-starter`
- project: `swd-pulse`
- original classification: `project_name=swd-pulse`, `type=template`
- issue: The package name duplicates the workspace root identity, while the README clearly describes `Node Backend Starter (Express)`. The artifact set does not reconcile whether this is a copied template, a renamed starter, or an accidental identity collision.
- evidence reviewed:
  - `/home/habib/workspace/projects/node-backend-starter/package.json`
  - `/home/habib/workspace/projects/node-backend-starter/README.md`
- challenge level: HIGH
- recommended corrected classification or NEEDS_REVIEW: `NEEDS_REVIEW` on project identity; registry should distinguish `node-backend-starter` from root `swd-pulse` before planning moves.

## 5. `projects/swd-finstack/mcp/server`
- project: `swd-finstack-mcp-server`
- original classification: `tests_present=yes`
- issue: No README was present and no local test files or test directories were found in the sampled structure. A `test` script exists in `package.json`, but the underlying evidence for actual tests is thin.
- evidence reviewed:
  - `/home/habib/workspace/projects/swd-finstack/mcp/server/package.json`
  - `/home/habib/workspace/projects/swd-finstack/mcp/server/server.js`
  - absence of `/home/habib/workspace/projects/swd-finstack/mcp/server/README.md`
  - no local `tests/`, `test/`, `__tests__/`, `*test.*`, or `*spec.*` hits in sampled scan
- challenge level: HIGH
- recommended corrected classification or NEEDS_REVIEW: `tests_present=no` or `NEEDS_REVIEW`; documentation remains `no`.

## 6. `projects/wps-hr-core`
- project: `wps-hr-core`
- original classification: `type=service`
- issue: The package is a Next.js App Router project with UI structure under `src/app`; the README is still boilerplate and does not justify a service classification.
- evidence reviewed:
  - `/home/habib/workspace/projects/wps-hr-core/package.json`
  - `/home/habib/workspace/projects/wps-hr-core/README.md`
  - `/home/habib/workspace/projects/wps-hr-core/src/app`
- challenge level: MEDIUM
- recommended corrected classification or NEEDS_REVIEW: `application` or `NEEDS_REVIEW` pending clearer product intent.

## 7. Dashboard Identity Split
- project: `swd-vault-dashboard`
- original classification: both `projects/SWD-ARC/apps/controls-center` and `vault/dashboard` are `ACTIVE`, `P0`, `application`
- issue: Both entries claim the same identity while READMEs show overlapping War Room/dashboard scope. The audit artifacts do not establish whether one supersedes the other, embeds the other, or should remain separately active.
- evidence reviewed:
  - `/home/habib/workspace/projects/SWD-ARC/apps/controls-center/README.md`
  - `/home/habib/workspace/projects/SWD-ARC/apps/controls-center/package.json`
  - `/home/habib/workspace/vault/dashboard/README.md`
  - `/home/habib/workspace/vault/dashboard/package.json`
- challenge level: HIGH
- recommended corrected classification or NEEDS_REVIEW: `NEEDS_REVIEW` on primary/legacy relationship before any move or consolidation planning.

## 8. Duplication Claims Depending on Generic Prefixes
- project: multiple
- original classification: duplicate/overlap signals in `duplication_matrix.md`
- issue: Several overlap claims are supported only by generic shared stack and name-prefix tokens such as `swd`, `docsmith`, `mcp`, or `server`, which is not enough to justify consolidation.
- evidence reviewed:
  - `/home/habib/workspace/operation-clean/analysis/duplication_matrix.md`
  - sampled READMEs for controls center, licensing service, payment gateway, SWD website, and SWD landing
- challenge level: MEDIUM
- recommended corrected classification or NEEDS_REVIEW: `NEEDS_REVIEW` for all non-starter duplication candidates until purpose, ownership, and dependency overlap are directly compared.
