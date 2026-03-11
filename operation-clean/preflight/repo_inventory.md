# Repo Inventory

- detected git repositories: 14

| repo_path | repo_kind | root_tracking_mode | dirty | modified | deleted | untracked |
|---|---|---|---|---:|---:|---:|
| `.` | workspace_root_repo | None | yes | 11 | 0 | 12 |
| `projects/SWD-ARC` | nested_gitlink_repo | 160000 | yes | 27 | 0 | 60 |
| `projects/SWD-dev-ec` | nested_gitlink_repo | 160000 | no | 0 | 0 | 0 |
| `projects/_archive/2026-03-03-workspace-reorg/absorbed-projects/SWD-mcp-server` | nested_gitlink_repo | 160000 | yes | 5 | 0 | 2 |
| `projects/_archive/2026-03-03-workspace-reorg/absorbed-projects/swd-os-governance` | nested_gitlink_repo | 160000 | yes | 0 | 3 | 0 |
| `projects/_archive/2026-03-03-workspace-reorg/user-requested/wps-sif-tool` | nested_gitlink_repo | 160000 | yes | 78 | 1 | 0 |
| `projects/docsmith-licensing-service` | nested_gitlink_repo | 160000 | yes | 3 | 0 | 7 |
| `projects/docsmith-payment-gateway` | nested_gitlink_repo | 160000 | no | 0 | 0 | 0 |
| `projects/node-backend-starter` | embedded_repo_tracked_by_root | none | no | 0 | 0 | 0 |
| `projects/node-backend-starter-v2` | nested_gitlink_repo | 160000 | no | 0 | 0 | 0 |
| `projects/swd-docsmith-sif-extension` | nested_gitlink_repo | 160000 | yes | 1 | 30 | 3 |
| `projects/swd-docsmith_brand-website` | nested_gitlink_repo | 160000 | yes | 19 | 35 | 6 |
| `projects/swd-landing` | nested_gitlink_repo | 160000 | yes | 2 | 0 | 11 |
| `projects/wps-hr-core` | nested_gitlink_repo | 160000 | yes | 49 | 0 | 0 |

## Notes
- `nested_gitlink_repo` means the workspace root tracks the repo path as a gitlink (`160000`) rather than ordinary files.
- `embedded_repo_tracked_by_root` means the nested repo has its own `.git`, but the workspace root also tracks ordinary files inside that path. This is especially risky for relocation.
- `workspace_root_repo` is the top-level `/home/habib/workspace` repository.