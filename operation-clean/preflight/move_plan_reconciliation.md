# Move Plan Reconciliation

- source of truth: `/home/habib/workspace/operation-clean/planning/move_plan_v2.csv`
- rows reviewed: 16
- sources existing: 16/16
- destination paths already existing: 0
- collision check PASS rows: 16/16
- prior directive example conflicts identified: 4

## Validation Summary
- All 16 source paths currently exist.
- No proposed destination path currently exists.
- No internal row-to-row path collision was found in `move_plan_v2.csv`.
- The destination parent for every row falls under the approved canonical top-level set.
- Execution readiness is still blocked because dirty-state and git-boundary risks dominate the plan.

## Row Findings
| project | source_exists | destination_exists | collision_check | execution_ready | primary_segment | notes |
|---|---|---|---|---|---|---|
| `workspace-root-orchestrator` | yes | no | PASS | no | BLOCKED_BY_PATH_CONFLICT | source would move into itself or into its own descendant path | Prior narrative expected `platform/swd-pulse`, while approved move plan uses `platform/workspace-root-orchestrator`.... |
| `arc-axis-adapter` | yes | no | PASS | no | BLOCKED_BY_GIT_BOUNDARY | source is a subdirectory inside nested repo `projects/SWD-ARC` and would be extracted across repo boundaries | containing repo `projects/SWD-ARC` is dirty |
| `swd-arc-controls-center` | yes | no | PASS | no | BLOCKED_BY_GIT_BOUNDARY | Prior narrative example proposed `platform/arc-console`, but approved move plan uses `platform/swd-arc-controls-center`. | source is a subdirectory inside nested repo `projects/SWD... |
| `swd-arc-mcp-server` | yes | no | PASS | no | BLOCKED_BY_GIT_BOUNDARY | source is a subdirectory inside nested repo `projects/SWD-ARC` and would be extracted across repo boundaries | containing repo `projects/SWD-ARC` is dirty | approved plan explicitl... |
| `swd-mcp-server-archive-copy` | yes | no | PASS | no | BLOCKED_BY_GIT_BOUNDARY | source is a nested repo root tracked by the workspace root as gitlink `projects/_archive/2026-03-03-workspace-reorg/absorbed-projects/SWD-mcp-server` | source path or ancestor is a... |
| `wps-sif-tool-archive` | yes | no | PASS | no | BLOCKED_BY_GIT_BOUNDARY | source is a nested repo root tracked by the workspace root as gitlink `projects/_archive/2026-03-03-workspace-reorg/user-requested/wps-sif-tool` | source path or ancestor is alread... |
| `docsmith-licensing-service` | yes | no | PASS | no | BLOCKED_BY_GIT_BOUNDARY | source is a nested repo root tracked by the workspace root as gitlink `projects/docsmith-licensing-service` | source path or ancestor is already dirty in workspace root repo | cont... |
| `docsmith-payment-gateway` | yes | no | PASS | no | BLOCKED_BY_GIT_BOUNDARY | source is a nested repo root tracked by the workspace root as gitlink `projects/docsmith-payment-gateway` | workspace root repo is dirty even though nested repo is clean | approved... |
| `node-backend-starter` | yes | no | PASS | no | BLOCKED_BY_GIT_BOUNDARY | Prior narrative example proposed archiving to `archive/node-backend-starter-v1`, but approved move plan uses `templates/node-backend-starter`. | source is an embedded repo root whi... |
| `node-backend-starter-v2` | yes | no | PASS | no | BLOCKED_BY_GIT_BOUNDARY | Prior narrative example proposed canonical replacement at `templates/node-backend-starter`, but approved move plan preserves `templates/node-backend-starter-v2`. | source is a nest... |
| `swd-docsmith-sif-extension` | yes | no | PASS | no | BLOCKED_BY_GIT_BOUNDARY | source is a nested repo root tracked by the workspace root as gitlink `projects/swd-docsmith-sif-extension` | source path or ancestor is already dirty in workspace root repo | cont... |
| `swd-docsmith-brand-website` | yes | no | PASS | no | BLOCKED_BY_GIT_BOUNDARY | source is a nested repo root tracked by the workspace root as gitlink `projects/swd-docsmith_brand-website` | source path or ancestor is already dirty in workspace root repo | cont... |
| `swd-finstack-mcp-server` | yes | no | PASS | no | BLOCKED_BY_DIRTY_STATE | source path or ancestor is already dirty in workspace root repo | approved plan explicitly marks this row for review before move |
| `swd-landing` | yes | no | PASS | no | BLOCKED_BY_GIT_BOUNDARY | source is a nested repo root tracked by the workspace root as gitlink `projects/swd-landing` | source path or ancestor is already dirty in workspace root repo | containing repo `pr... |
| `wps-hr-core` | yes | no | PASS | no | BLOCKED_BY_GIT_BOUNDARY | source is a nested repo root tracked by the workspace root as gitlink `projects/wps-hr-core` | source path or ancestor is already dirty in workspace root repo | containing repo `pr... |
| `vault-dashboard-legacy` | yes | no | PASS | no | NEEDS_PRIME_DECISION | approved plan requires consolidation review before any move |

## Prior Directive Conflicts
- `.`: Prior narrative expected `platform/swd-pulse`, while approved move plan uses `platform/workspace-root-orchestrator`.
- `projects/SWD-ARC/apps/controls-center`: Prior narrative example proposed `platform/arc-console`, but approved move plan uses `platform/swd-arc-controls-center`.
- `projects/node-backend-starter-v2`: Prior narrative example proposed canonical replacement at `templates/node-backend-starter`, but approved move plan preserves `templates/node-backend-starter-v2`.
- `projects/node-backend-starter`: Prior narrative example proposed archiving to `archive/node-backend-starter-v1`, but approved move plan uses `templates/node-backend-starter`.