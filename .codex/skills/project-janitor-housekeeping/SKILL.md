---
name: project-janitor-housekeeping
description: Keep repositories clean, organized, and low-noise by removing clutter, fixing stale artifacts, and maintaining hygiene standards. Use when the user asks for cleanup, housekeeping, repo tidying, or maintenance chores.
---

# Project Janitor Housekeeping

## Workflow

1. Scan for generated artifacts, stale outputs, and temporary files.
2. Confirm cleanup scope before deleting anything significant.
3. Apply non-destructive cleanup first (ignore rules, docs, script alignment).
4. Remove safe artifacts (caches, build output, temp dumps) from tracked changes.
5. Re-run lint/test/build smoke checks after cleanup.

## Hygiene Targets

- Keep `.gitignore` current.
- Keep scripts and docs synchronized.
- Remove duplicate notes/spec files when canonical docs exist.
- Keep `output/`, `dist/`, and local dumps out of commits unless explicitly required.

## Output Rules

- Report deleted/ignored artifact categories.
- Report any risky cleanup candidates separately.
- Keep maintenance commits small and reviewable.

## Reference

- `references/housekeeping-checklist.md`
