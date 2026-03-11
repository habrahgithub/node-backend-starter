# Recovery Verdict

## Overall Status
PARTIALLY RECOVERED

## Executable Filesystem Scope
0 rows

## Migration Scope
12 rows

## Decision-Gated Items
- `vault-dashboard-legacy`

## Key Findings
1. The blocked normalization plan can be repaired by removing the invalid `.` row and converting most remaining rows from moves into migration-grade work.
2. After repo-boundary and dirty-state analysis, only `swd-finstack-mcp-server` remains a plausible future same-repo move, and even that is blocked until a clean baseline exists.
3. Archive rows can be kept as logical-only classifications, while ARC control-plane work and starter-lineage cleanup require dedicated migration projects.

## Recommended Next Step
- Adopt `move_plan_v3.csv` as the repo-safe control artifact, then baseline the root and nested repos before considering the single `SAFE_AFTER_CLEAN_BASELINE` candidate or launching the migration backlog items.