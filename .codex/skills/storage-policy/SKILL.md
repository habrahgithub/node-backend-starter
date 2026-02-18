---
name: storage-policy
description: Enforce repository storage hygiene and prevent commit bloat. Use when adding files, handling generated outputs, updating ignore rules, or deciding whether artifacts should be tracked.
---

# Storage Policy

## Workflow

1. Follow `docs/STORAGE.md` before adding non-source files.
2. Reject logs, dumps, caches, temporary files, and build outputs from commits.
3. Add or update `.gitignore` patterns when new artifact types appear.
4. Confirm before committing generated files that must be retained.
5. Keep evidence assets minimal and intentional.

## Guardrails

- Prefer reproducible scripts over committed generated output.
- Store only files required for source-of-truth, compliance, or reproducibility.
- Remove accidental artifacts immediately when discovered.
