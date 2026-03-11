---
name: prisma-postgres-ops
description: Run Prisma and Postgres operational workflows for Node services, including generate, migrate, seed, and test reset. Use when working with Prisma-backed projects such as projects/node-backend-starter-v2.
---

# Prisma Postgres Ops

## Scope

Operate Prisma workflows in `projects/node-backend-starter-v2`.

## Workflow

1. Install dependencies and verify Node version compatibility.
2. Run `npm run prisma:generate` after schema changes.
3. Use `npm run prisma:migrate:dev` for local migrations.
4. Use `npm run prisma:migrate:deploy` for deployment-safe migration apply.
5. Run `npm run prisma:seed` when test data is required.
6. Use `npm run prisma:reset:test` only for controlled test reset flows.

## Environment

- Set `DATABASE_URL` for active environment.
- Set separate database URLs for dev and test contexts when available.

## Guardrails

- Never run destructive reset commands against production data.
- Keep migration files ordered and committed with related code.
- Re-run targeted integration tests after schema or repository adapter changes.
