# Repo Boundary Matrix

| project_name | current_path | owning_repo | repo_root | nested_repo_detected | proposed_path | target_repo_context | boundary_crossing | safe_as_filesystem_move |
|---|---|---|---|---|---|---|---|---|
| `arc-axis-adapter` | `projects/SWD-ARC/Lab Template/files` | `projects/SWD-ARC` | `/home/habib/workspace/projects/SWD-ARC` | yes | `templates/arc-axis-adapter` | workspace-root logical target outside the SWD-ARC repo | yes | no |
| `swd-arc-controls-center` | `projects/SWD-ARC/apps/controls-center` | `projects/SWD-ARC` | `/home/habib/workspace/projects/SWD-ARC` | yes | `platform/swd-arc-controls-center` | future logical ARC platform target outside the SWD-ARC repo | yes | no |
| `swd-arc-mcp-server` | `projects/SWD-ARC/mcp/server` | `projects/SWD-ARC` | `/home/habib/workspace/projects/SWD-ARC` | yes | `tooling/swd-arc-mcp-server` | workspace-root tooling target outside the SWD-ARC repo | yes | no |
| `swd-mcp-server-archive-copy` | `projects/_archive/2026-03-03-workspace-reorg/absorbed-projects/SWD-mcp-server` | `projects/_archive/2026-03-03-workspace-reorg/absorbed-projects/SWD-mcp-server` | `/home/habib/workspace/projects/_archive/2026-03-03-workspace-reorg/absorbed-projects/SWD-mcp-server` | yes | `archive/swd-mcp-server-archive-copy` | existing archive classification only | yes | no |
| `wps-sif-tool-archive` | `projects/_archive/2026-03-03-workspace-reorg/user-requested/wps-sif-tool` | `projects/_archive/2026-03-03-workspace-reorg/user-requested/wps-sif-tool` | `/home/habib/workspace/projects/_archive/2026-03-03-workspace-reorg/user-requested/wps-sif-tool` | yes | `archive/wps-sif-tool-archive` | existing archive classification only | yes | no |
| `docsmith-licensing-service` | `projects/docsmith-licensing-service` | `projects/docsmith-licensing-service` | `/home/habib/workspace/projects/docsmith-licensing-service` | yes | `services/docsmith-licensing-service` | workspace-root services namespace | yes | no |
| `docsmith-payment-gateway` | `projects/docsmith-payment-gateway` | `projects/docsmith-payment-gateway` | `/home/habib/workspace/projects/docsmith-payment-gateway` | yes | `services/docsmith-payment-gateway` | workspace-root services namespace | yes | no |
| `node-backend-starter` | `projects/node-backend-starter` | `projects/node-backend-starter` | `/home/habib/workspace/projects/node-backend-starter` | yes | `templates/node-backend-starter` | workspace-root templates namespace | yes | no |
| `node-backend-starter-v2` | `projects/node-backend-starter-v2` | `projects/node-backend-starter-v2` | `/home/habib/workspace/projects/node-backend-starter-v2` | yes | `templates/node-backend-starter-v2` | workspace-root templates namespace | yes | no |
| `swd-docsmith-sif-extension` | `projects/swd-docsmith-sif-extension` | `projects/swd-docsmith-sif-extension` | `/home/habib/workspace/projects/swd-docsmith-sif-extension` | yes | `extensions/swd-docsmith-sif-extension` | workspace-root extensions namespace | yes | no |
| `swd-docsmith-brand-website` | `projects/swd-docsmith_brand-website` | `projects/swd-docsmith_brand-website` | `/home/habib/workspace/projects/swd-docsmith_brand-website` | yes | `applications/swd-docsmith-brand-website` | workspace-root applications namespace | yes | no |
| `swd-finstack-mcp-server` | `projects/swd-finstack/mcp/server` | `workspace-root` | `/home/habib/workspace` | no | `tooling/swd-finstack-mcp-server` | workspace-root tooling namespace | no | yes |
| `swd-landing` | `projects/swd-landing` | `projects/swd-landing` | `/home/habib/workspace/projects/swd-landing` | yes | `applications/swd-landing` | workspace-root applications namespace | yes | no |
| `wps-hr-core` | `projects/wps-hr-core` | `projects/wps-hr-core` | `/home/habib/workspace/projects/wps-hr-core` | yes | `applications/wps-hr-core` | workspace-root applications namespace | yes | no |
| `vault-dashboard-legacy` | `vault/dashboard` | `workspace-root` | `/home/habib/workspace` | no | `platform/vault-dashboard-legacy` | workspace-root platform namespace | no | no |

## arc-axis-adapter
- current repo root: `/home/habib/workspace/projects/SWD-ARC`
- nested repo or gitlink detected: yes
- target crosses repo boundary: yes
- safe as filesystem move: no
- risk explanation: The source is a subdirectory inside the dirty `projects/SWD-ARC` repo; extracting it would cross repo boundaries and is not a simple filesystem move.

## swd-arc-controls-center
- current repo root: `/home/habib/workspace/projects/SWD-ARC`
- nested repo or gitlink detected: yes
- target crosses repo boundary: yes
- safe as filesystem move: no
- risk explanation: This is both a subdirectory extraction from `projects/SWD-ARC` and the current seed of the logical ARC control plane, so it requires an architectural migration project rather than a move.

## swd-arc-mcp-server
- current repo root: `/home/habib/workspace/projects/SWD-ARC`
- nested repo or gitlink detected: yes
- target crosses repo boundary: yes
- safe as filesystem move: no
- risk explanation: The MCP server sits inside the dirty `projects/SWD-ARC` repo, so relocating it would be a repo extraction exercise rather than a filesystem-only move.

## swd-mcp-server-archive-copy
- current repo root: `/home/habib/workspace/projects/_archive/2026-03-03-workspace-reorg/absorbed-projects/SWD-mcp-server`
- nested repo or gitlink detected: yes
- target crosses repo boundary: yes
- safe as filesystem move: no
- risk explanation: Archive items do not need physical normalization; this path is already logically archived and moving the nested repo would create unnecessary git-boundary churn.

## wps-sif-tool-archive
- current repo root: `/home/habib/workspace/projects/_archive/2026-03-03-workspace-reorg/user-requested/wps-sif-tool`
- nested repo or gitlink detected: yes
- target crosses repo boundary: yes
- safe as filesystem move: no
- risk explanation: This item is already logically archived. The physical move would relocate a dirty nested repo and is unnecessary for governance cleanup.

## docsmith-licensing-service
- current repo root: `/home/habib/workspace/projects/docsmith-licensing-service`
- nested repo or gitlink detected: yes
- target crosses repo boundary: yes
- safe as filesystem move: no
- risk explanation: The service is a dirty nested repo tracked by the workspace root as a gitlink, so changing its path is a repo relocation problem rather than a safe move.

## docsmith-payment-gateway
- current repo root: `/home/habib/workspace/projects/docsmith-payment-gateway`
- nested repo or gitlink detected: yes
- target crosses repo boundary: yes
- safe as filesystem move: no
- risk explanation: Even though the nested repo itself is currently clean, the path is a gitlink-backed nested repo and the workspace root is dirty, so this is still a repo relocation problem.

## node-backend-starter
- current repo root: `/home/habib/workspace/projects/node-backend-starter`
- nested repo or gitlink detected: yes
- target crosses repo boundary: yes
- safe as filesystem move: no
- risk explanation: This is an embedded repo whose files are also tracked directly by the workspace root, so any relocation requires disentangling repository ownership before touching the filesystem.

## node-backend-starter-v2
- current repo root: `/home/habib/workspace/projects/node-backend-starter-v2`
- nested repo or gitlink detected: yes
- target crosses repo boundary: yes
- safe as filesystem move: no
- risk explanation: Preferred starter candidate or not, the project is still a gitlink-backed nested repo and cannot be normalized by a simple `mv`.

## swd-docsmith-sif-extension
- current repo root: `/home/habib/workspace/projects/swd-docsmith-sif-extension`
- nested repo or gitlink detected: yes
- target crosses repo boundary: yes
- safe as filesystem move: no
- risk explanation: The extension is a dirty nested repo tracked by gitlink, so filesystem normalization would actually be a repo relocation exercise.

## swd-docsmith-brand-website
- current repo root: `/home/habib/workspace/projects/swd-docsmith_brand-website`
- nested repo or gitlink detected: yes
- target crosses repo boundary: yes
- safe as filesystem move: no
- risk explanation: This is a dirty nested repo tracked by gitlink. The desired separator normalization is logical naming, not an immediately safe physical move.

## swd-finstack-mcp-server
- current repo root: `/home/habib/workspace`
- nested repo or gitlink detected: no
- target crosses repo boundary: no
- safe as filesystem move: yes
- risk explanation: This is the only candidate that remains inside the workspace root repo, but the source path is already dirty and the approved plan marked it for review before move.

## swd-landing
- current repo root: `/home/habib/workspace/projects/swd-landing`
- nested repo or gitlink detected: yes
- target crosses repo boundary: yes
- safe as filesystem move: no
- risk explanation: The project is a dirty nested gitlink-backed repo, so moving it would require repo relocation governance rather than filesystem normalization.

## wps-hr-core
- current repo root: `/home/habib/workspace/projects/wps-hr-core`
- nested repo or gitlink detected: yes
- target crosses repo boundary: yes
- safe as filesystem move: no
- risk explanation: The project is a dirty nested repo tracked by gitlink, so moving it would cross repo boundaries and should be treated as repo relocation work.

## vault-dashboard-legacy
- current repo root: `/home/habib/workspace`
- nested repo or gitlink detected: no
- target crosses repo boundary: no
- safe as filesystem move: no
- risk explanation: The approved plan itself requires consolidation review before any move because `vault/dashboard` remains a separate tooling/security candidate relative to the ARC control plane.
