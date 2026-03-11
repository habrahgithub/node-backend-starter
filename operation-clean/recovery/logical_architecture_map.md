# Logical Architecture Map

This map defines the approved logical operating model without requiring physical moves.

## Platform Core
- `arc-console` = logical unified ARC control plane.
- Current implementation seed: `projects/SWD-ARC/apps/controls-center` (`swd-arc-controls-center`).
- Workspace root orchestrator remains a platform coordination concept, but the invalid `.` move row is removed from physical execution planning.
- `vault/dashboard` remains a separate tooling/security candidate until a future dashboard consolidation project is approved.

## Services
- `docsmith-licensing-service` = business service.
- `docsmith-payment-gateway` = business service.
- Services remain logically under `services/` even while their repos stay physically in place.

## Applications
- `swd-docsmith-brand-website` = product website/application.
- `swd-landing` = product/marketing application.
- `wps-hr-core` = application candidate with conservative maturity status.

## Tooling
- `swd-arc-mcp-server` = ARC tooling component within the SWD-ARC repo.
- `swd-finstack-mcp-server` = workspace-root tooling candidate; only potential same-repo move after a clean baseline.

## Extensions
- `swd-docsmith-sif-extension` = extension product repo.

## Templates
- `node-backend-starter-v2` = preferred starter candidate logically.
- `node-backend-starter` = legacy starter candidate logically; physical canonicalization requires a lineage migration project.
- `arc-axis-adapter` = reusable template artifact logically, even while physically inside SWD-ARC.

## Archive
- `swd-mcp-server-archive-copy` and `wps-sif-tool-archive` remain logically archived even if physically unmoved.

## Docs
- `docs/` remains the workspace documentation namespace; no additional documentation moves are required for logical normalization.

## Unified ARC Control Plane Relationships
- `swd-arc-controls-center` is the current implementation seed for the logical `arc-console`.
- `vault/dashboard` is not treated as duplicate UI to be moved now; it is an architectural decision point and potential future tooling merge candidate.
- Any future unification of ARC surfaces must be delivered as a migration project with explicit repo-boundary handling, not as workspace normalization.