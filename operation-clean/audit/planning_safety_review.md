# Planning Safety Review

## Safe Recommendations
- Keeping archive candidates logically separated from active items is directionally safe.
- Requiring Prime approval for starter consolidation, archive retention decisions, and naming normalization is appropriate.
- Deferring most active items to `keep_in_place` reduces immediate destructive risk.

## Risky Recommendations
- `projects/docsmith-licensing-service -> docs/docsmith-licensing-service` is unsafe because it would relocate a live service into a documentation bucket.
- `projects/docsmith-payment-gateway -> docs/docsmith-payment-gateway` has the same unsafe service-to-docs problem.
- `projects/SWD-ARC/mcp/server -> tooling/server` and `projects/swd-finstack/mcp/server -> tooling/server` collide on the same proposed destination.
- `projects/SWD-ARC/Lab Template/files -> templates/files` is overly generic and creates ambiguity around what `files` means once detached from its parent context.
- `. -> services/` for the workspace root is not actionable as a move plan item and would be dangerous without explicitly separating workspace-level tooling from deployable assets.
- Treating both dashboard variants as unchanged active `P0` applications without dependency review leaves a likely overlap unresolved.

## Ambiguous Recommendations
- `naming_normalization.md` addresses separator style but does not resolve duplicate project identities (`swd-pulse`, `swd-vault-dashboard`, `swd-mcp-server`).
- `duplication_matrix.md` implies several consolidation reviews, but the evidence is too generic for safe merge planning.
- `target_structure.md` is structurally reasonable, but it lacks rules for nested repos, absorbed projects, ownership, and deployment boundaries.

## Blocked Recommendations Needing Prime Approval
- Any actual move, archive relocation, or consolidation based on the current `move_plan.csv`.
- Any attempt to normalize the workspace root `.` as if it were a single deployable service.
- Any decision to de-duplicate or absorb either dashboard entry or either MCP server entry without explicit dependency and runtime authority review.
- Any rename or move of `projects/SWD-ARC/Lab Template/files` until a stable project identity and destination are defined.

## Summary of Move-Plan Safety
- Safety verdict: FAIL.
- Reason: The move plan is not execution-safe because it contains misclassified live services, at least one destination collision, and several ambiguous identities that could cause destructive or confusing restructuring if executed as written.
