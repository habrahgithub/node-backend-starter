# Executable Scope

## SAFE_NOW
- None

## SAFE_AFTER_CLEAN_BASELINE
- `swd-finstack-mcp-server`: This is the only candidate that remains inside the workspace root repo, but the source path is already dirty and the approved plan marked it for review before move. Prerequisite: Create a clean workspace-root baseline and re-confirm authority for the single same-repo move.

## NEVER_AS_SIMPLE_MOVE
- `arc-axis-adapter` (SUBDIRECTORY_EXTRACTION_BLOCKED): The source is a subdirectory inside the dirty `projects/SWD-ARC` repo; extracting it would cross repo boundaries and is not a simple filesystem move.
- `swd-arc-controls-center` (MIGRATION_PROJECT_REQUIRED): This is both a subdirectory extraction from `projects/SWD-ARC` and the current seed of the logical ARC control plane, so it requires an architectural migration project rather than a move.
- `swd-arc-mcp-server` (SUBDIRECTORY_EXTRACTION_BLOCKED): The MCP server sits inside the dirty `projects/SWD-ARC` repo, so relocating it would be a repo extraction exercise rather than a filesystem-only move.
- `docsmith-licensing-service` (GITLINK_OR_NESTED_REPO_BLOCKED): The service is a dirty nested repo tracked by the workspace root as a gitlink, so changing its path is a repo relocation problem rather than a safe move.
- `docsmith-payment-gateway` (GITLINK_OR_NESTED_REPO_BLOCKED): Even though the nested repo itself is currently clean, the path is a gitlink-backed nested repo and the workspace root is dirty, so this is still a repo relocation problem.
- `node-backend-starter` (MIGRATION_PROJECT_REQUIRED): This is an embedded repo whose files are also tracked directly by the workspace root, so any relocation requires disentangling repository ownership before touching the filesystem.
- `node-backend-starter-v2` (GITLINK_OR_NESTED_REPO_BLOCKED): Preferred starter candidate or not, the project is still a gitlink-backed nested repo and cannot be normalized by a simple `mv`.
- `swd-docsmith-sif-extension` (GITLINK_OR_NESTED_REPO_BLOCKED): The extension is a dirty nested repo tracked by gitlink, so filesystem normalization would actually be a repo relocation exercise.
- `swd-docsmith-brand-website` (GITLINK_OR_NESTED_REPO_BLOCKED): This is a dirty nested repo tracked by gitlink. The desired separator normalization is logical naming, not an immediately safe physical move.
- `swd-landing` (GITLINK_OR_NESTED_REPO_BLOCKED): The project is a dirty nested gitlink-backed repo, so moving it would require repo relocation governance rather than filesystem normalization.
- `wps-hr-core` (GITLINK_OR_NESTED_REPO_BLOCKED): The project is a dirty nested repo tracked by gitlink, so moving it would cross repo boundaries and should be treated as repo relocation work.

## Decision Summary
- Executable now: 0 rows.
- Executable only after a clean baseline: 1 rows.
- Never executable as a simple move: 11 rows.
- Logical-only archive rows: 2 rows.
- Decision-gated rows: 1 rows.
- The recovery model leaves logical normalization intact while separating migration work from true filesystem operations.