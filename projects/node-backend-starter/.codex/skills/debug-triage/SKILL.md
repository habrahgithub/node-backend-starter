---
name: debug-triage
description: Diagnose failures quickly with minimal context and reproducible evidence. Use when tests fail, services crash, builds break, or behavior differs between local and deployed environments.
---

# Debug Triage

## Workflow

1. Reproduce the issue with the smallest command or request path.
2. Capture only decisive evidence: error type, failing step, and first relevant stack line.
3. Isolate likely fault domain: config, data, dependency, runtime, or code regression.
4. Propose the smallest safe fix that addresses the confirmed root cause.
5. Re-run targeted verification before broad test suites.

## Evidence Rules

- Prefer one failing command plus one passing command after fix.
- Avoid full log dumps; keep only key error lines and path references.
- State uncertainty explicitly when evidence is incomplete.
