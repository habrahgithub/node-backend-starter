# Git Boundary Risk

## Summary
- rows blocked by git-boundary concerns: 13
- boundary risks include gitlinks in the workspace root, embedded repos, and extraction of directories out of nested repos.

## Boundary Patterns
- `.` would move the active root repository into one of its own descendants, which is structurally invalid.
- `projects/SWD-ARC/*` rows extract directories out of the nested `projects/SWD-ARC` repository, crossing repository boundaries.
- Several project roots are tracked by the workspace root as gitlinks (`160000`), so moving them would change both root-repo gitlink paths and nested repo locations.
- `projects/node-backend-starter` is an embedded repo whose files are also tracked normally by the workspace root, creating a mixed-boundary relocation risk.

## Move-by-Move Boundary Assessment
### workspace-root-orchestrator
- current_path: `.`
- containing repo: `.`
- repo kind: workspace_root_repo
- primary segment: BLOCKED_BY_PATH_CONFLICT
- boundary note: source would move into itself or into its own descendant path | Prior narrative expected `platform/swd-pulse`, while approved move plan uses `platform/workspace-root-orchestrator`. | moving the workspace root would relocate the active root repo into its own child path | source path or ancestor is already dirty in workspace root repo | approved plan explicitly marks this row for review before move

### arc-axis-adapter
- current_path: `projects/SWD-ARC/Lab Template/files`
- containing repo: `projects/SWD-ARC`
- repo kind: nested_gitlink_repo
- primary segment: BLOCKED_BY_GIT_BOUNDARY
- boundary note: source is a subdirectory inside nested repo `projects/SWD-ARC` and would be extracted across repo boundaries | containing repo `projects/SWD-ARC` is dirty

### swd-arc-controls-center
- current_path: `projects/SWD-ARC/apps/controls-center`
- containing repo: `projects/SWD-ARC`
- repo kind: nested_gitlink_repo
- primary segment: BLOCKED_BY_GIT_BOUNDARY
- boundary note: Prior narrative example proposed `platform/arc-console`, but approved move plan uses `platform/swd-arc-controls-center`. | source is a subdirectory inside nested repo `projects/SWD-ARC` and would be extracted across repo boundaries | containing repo `projects/SWD-ARC` is dirty | approved plan explicitly marks this row for review before move

### swd-arc-mcp-server
- current_path: `projects/SWD-ARC/mcp/server`
- containing repo: `projects/SWD-ARC`
- repo kind: nested_gitlink_repo
- primary segment: BLOCKED_BY_GIT_BOUNDARY
- boundary note: source is a subdirectory inside nested repo `projects/SWD-ARC` and would be extracted across repo boundaries | containing repo `projects/SWD-ARC` is dirty | approved plan explicitly marks this row for review before move

### swd-mcp-server-archive-copy
- current_path: `projects/_archive/2026-03-03-workspace-reorg/absorbed-projects/SWD-mcp-server`
- containing repo: `projects/_archive/2026-03-03-workspace-reorg/absorbed-projects/SWD-mcp-server`
- repo kind: nested_gitlink_repo
- primary segment: BLOCKED_BY_GIT_BOUNDARY
- boundary note: source is a nested repo root tracked by the workspace root as gitlink `projects/_archive/2026-03-03-workspace-reorg/absorbed-projects/SWD-mcp-server` | source path or ancestor is already dirty in workspace root repo | containing repo `projects/_archive/2026-03-03-workspace-reorg/absorbed-projects/SWD-mcp-server` is dirty

### wps-sif-tool-archive
- current_path: `projects/_archive/2026-03-03-workspace-reorg/user-requested/wps-sif-tool`
- containing repo: `projects/_archive/2026-03-03-workspace-reorg/user-requested/wps-sif-tool`
- repo kind: nested_gitlink_repo
- primary segment: BLOCKED_BY_GIT_BOUNDARY
- boundary note: source is a nested repo root tracked by the workspace root as gitlink `projects/_archive/2026-03-03-workspace-reorg/user-requested/wps-sif-tool` | source path or ancestor is already dirty in workspace root repo | containing repo `projects/_archive/2026-03-03-workspace-reorg/user-requested/wps-sif-tool` is dirty

### docsmith-licensing-service
- current_path: `projects/docsmith-licensing-service`
- containing repo: `projects/docsmith-licensing-service`
- repo kind: nested_gitlink_repo
- primary segment: BLOCKED_BY_GIT_BOUNDARY
- boundary note: source is a nested repo root tracked by the workspace root as gitlink `projects/docsmith-licensing-service` | source path or ancestor is already dirty in workspace root repo | containing repo `projects/docsmith-licensing-service` is dirty | approved plan explicitly marks this row for review before move

### docsmith-payment-gateway
- current_path: `projects/docsmith-payment-gateway`
- containing repo: `projects/docsmith-payment-gateway`
- repo kind: nested_gitlink_repo
- primary segment: BLOCKED_BY_GIT_BOUNDARY
- boundary note: source is a nested repo root tracked by the workspace root as gitlink `projects/docsmith-payment-gateway` | workspace root repo is dirty even though nested repo is clean | approved plan explicitly marks this row for review before move

### node-backend-starter
- current_path: `projects/node-backend-starter`
- containing repo: `projects/node-backend-starter`
- repo kind: embedded_repo_tracked_by_root
- primary segment: BLOCKED_BY_GIT_BOUNDARY
- boundary note: Prior narrative example proposed archiving to `archive/node-backend-starter-v1`, but approved move plan uses `templates/node-backend-starter`. | source is an embedded repo root while the workspace root tracks regular files under `projects/node-backend-starter`

### node-backend-starter-v2
- current_path: `projects/node-backend-starter-v2`
- containing repo: `projects/node-backend-starter-v2`
- repo kind: nested_gitlink_repo
- primary segment: BLOCKED_BY_GIT_BOUNDARY
- boundary note: Prior narrative example proposed canonical replacement at `templates/node-backend-starter`, but approved move plan preserves `templates/node-backend-starter-v2`. | source is a nested repo root tracked by the workspace root as gitlink `projects/node-backend-starter-v2` | workspace root repo is dirty even though nested repo is clean | approved plan explicitly marks this row for review before move

### swd-docsmith-sif-extension
- current_path: `projects/swd-docsmith-sif-extension`
- containing repo: `projects/swd-docsmith-sif-extension`
- repo kind: nested_gitlink_repo
- primary segment: BLOCKED_BY_GIT_BOUNDARY
- boundary note: source is a nested repo root tracked by the workspace root as gitlink `projects/swd-docsmith-sif-extension` | source path or ancestor is already dirty in workspace root repo | containing repo `projects/swd-docsmith-sif-extension` is dirty | approved plan explicitly marks this row for review before move

### swd-docsmith-brand-website
- current_path: `projects/swd-docsmith_brand-website`
- containing repo: `projects/swd-docsmith_brand-website`
- repo kind: nested_gitlink_repo
- primary segment: BLOCKED_BY_GIT_BOUNDARY
- boundary note: source is a nested repo root tracked by the workspace root as gitlink `projects/swd-docsmith_brand-website` | source path or ancestor is already dirty in workspace root repo | containing repo `projects/swd-docsmith_brand-website` is dirty

### swd-finstack-mcp-server
- current_path: `projects/swd-finstack/mcp/server`
- containing repo: `.`
- repo kind: workspace_root_repo
- primary segment: BLOCKED_BY_DIRTY_STATE
- boundary note: source path or ancestor is already dirty in workspace root repo | approved plan explicitly marks this row for review before move

### swd-landing
- current_path: `projects/swd-landing`
- containing repo: `projects/swd-landing`
- repo kind: nested_gitlink_repo
- primary segment: BLOCKED_BY_GIT_BOUNDARY
- boundary note: source is a nested repo root tracked by the workspace root as gitlink `projects/swd-landing` | source path or ancestor is already dirty in workspace root repo | containing repo `projects/swd-landing` is dirty | approved plan explicitly marks this row for review before move

### wps-hr-core
- current_path: `projects/wps-hr-core`
- containing repo: `projects/wps-hr-core`
- repo kind: nested_gitlink_repo
- primary segment: BLOCKED_BY_GIT_BOUNDARY
- boundary note: source is a nested repo root tracked by the workspace root as gitlink `projects/wps-hr-core` | source path or ancestor is already dirty in workspace root repo | containing repo `projects/wps-hr-core` is dirty | approved plan explicitly marks this row for review before move

### vault-dashboard-legacy
- current_path: `vault/dashboard`
- containing repo: `.`
- repo kind: workspace_root_repo
- primary segment: NEEDS_PRIME_DECISION
- boundary note: approved plan requires consolidation review before any move
