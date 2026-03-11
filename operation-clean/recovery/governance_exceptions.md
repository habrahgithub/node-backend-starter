# Governance Exceptions

## Explicit Exceptions Applied
- Removed the invalid `.` -> `platform/workspace-root-orchestrator` row from execution candidates. It remains a logical platform concept only.
- Marked `vault/dashboard` as `DECISION_GATED`; no physical normalization is authorized without a Prime-level consolidation decision.
- Converted archive rows to logical-only treatment: `swd-mcp-server-archive-copy` and `wps-sif-tool-archive` remain classified as archive even if physically unmoved.
- Recast all nested-repo and subdirectory-extraction rows as migration work rather than filesystem normalization.

## Logical Classification Retained While Physical Move Is Blocked
- `arc-axis-adapter` remains logically categorized under `templates/`, but the physical move is blocked by `SUBDIRECTORY_EXTRACTION_BLOCKED`.
- `swd-arc-controls-center` remains logically categorized under `platform/`, but the physical move is blocked by `MIGRATION_PROJECT_REQUIRED`.
- `swd-arc-mcp-server` remains logically categorized under `tooling/`, but the physical move is blocked by `SUBDIRECTORY_EXTRACTION_BLOCKED`.
- `swd-mcp-server-archive-copy` remains logically categorized under `archive/`, but the physical move is blocked by `ARCHIVE_LOGICAL_ONLY`.
- `wps-sif-tool-archive` remains logically categorized under `archive/`, but the physical move is blocked by `ARCHIVE_LOGICAL_ONLY`.
- `docsmith-licensing-service` remains logically categorized under `services/`, but the physical move is blocked by `GITLINK_OR_NESTED_REPO_BLOCKED`.
- `docsmith-payment-gateway` remains logically categorized under `services/`, but the physical move is blocked by `GITLINK_OR_NESTED_REPO_BLOCKED`.
- `node-backend-starter` remains logically categorized under `templates/`, but the physical move is blocked by `MIGRATION_PROJECT_REQUIRED`.
- `node-backend-starter-v2` remains logically categorized under `templates/`, but the physical move is blocked by `GITLINK_OR_NESTED_REPO_BLOCKED`.
- `swd-docsmith-sif-extension` remains logically categorized under `extensions/`, but the physical move is blocked by `GITLINK_OR_NESTED_REPO_BLOCKED`.
- `swd-docsmith-brand-website` remains logically categorized under `applications/`, but the physical move is blocked by `GITLINK_OR_NESTED_REPO_BLOCKED`.
- `swd-landing` remains logically categorized under `applications/`, but the physical move is blocked by `GITLINK_OR_NESTED_REPO_BLOCKED`.
- `wps-hr-core` remains logically categorized under `applications/`, but the physical move is blocked by `GITLINK_OR_NESTED_REPO_BLOCKED`.

## Items Requiring Architectural Consolidation Instead of Filesystem Normalization
- `swd-arc-controls-center`: future `arc-console` seed; requires migration design, not extraction by `mv`.
- `vault-dashboard-legacy`: separate tooling/security candidate until a later merge project is approved.
- `node-backend-starter` versus `node-backend-starter-v2`: lineage decision affects any future physical canonicalization.