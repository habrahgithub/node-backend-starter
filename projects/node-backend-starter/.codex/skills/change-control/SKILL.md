---
name: change-control
description: Keep repository changes controlled, reviewable, and low-risk. Use when implementing or modifying code or docs in this workspace, especially when scope control, decision logging, and minimal diffs are required.
---

# Change Control

## Workflow

1. Read `docs/CONTEXT.md` and the target project `README.md` before editing.
2. Limit the change set to the requested outcome and avoid opportunistic refactors.
3. Update canonical docs instead of creating duplicate specification files.
4. Record policy or architecture decisions in `docs/DECISIONS.md` when behavior or governance changes.
5. Keep commits small and focused when asked to commit.

## Guardrails

- Preserve business behavior unless the request explicitly changes it.
- Flag high-impact or irreversible operations before executing them.
- Keep generated artifacts, logs, dumps, caches, and build output out of version control.
