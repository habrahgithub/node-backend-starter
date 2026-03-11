# Classification Report

## Classification Logic
- Priority is based on inferred business centrality, path naming, and apparent product importance.
- Status is inferred from path signals (archive/template/v2/lab), tests, and docs presence.
- Uncertain fields are marked `NEEDS_REVIEW`.

## Project-by-Project Classification

### swd-pulse
- current_path: `.`
- type: service
- language: JavaScript/TypeScript
- framework: Express, Mongoose
- tests_present: yes
- docs_present: partial
- priority: P0
- status: ACTIVE
- suggested_target_group: services
- recommended_action: keep_in_place
- rationale: Type inferred from path and package manifest; tests=yes, docs=partial.
- evidence_paths: package.json

### arc-axis-adapter
- current_path: `projects/SWD-ARC/Lab Template/files`
- type: template
- language: JavaScript/TypeScript
- framework: Express
- tests_present: yes
- docs_present: yes
- priority: P3
- status: TEMPLATE
- suggested_target_group: templates
- recommended_action: move_to_normalized_group
- rationale: Type inferred from path and package manifest; tests=yes, docs=yes.
- evidence_paths: projects/SWD-ARC/Lab Template/files/package.json, projects/SWD-ARC/Lab Template/files/README.md

### swd-vault-dashboard
- current_path: `projects/SWD-ARC/apps/controls-center`
- type: application
- language: JavaScript/TypeScript
- framework: Next.js, React
- tests_present: yes
- docs_present: yes
- priority: P0
- status: ACTIVE
- suggested_target_group: applications
- recommended_action: keep_in_place
- rationale: Type inferred from path and package manifest; tests=yes, docs=yes.
- evidence_paths: projects/SWD-ARC/apps/controls-center/package.json, projects/SWD-ARC/apps/controls-center/README.md

### swd-mcp-server
- current_path: `projects/SWD-ARC/mcp/server`
- type: tooling
- language: JavaScript/TypeScript
- framework: NEEDS_REVIEW
- tests_present: yes
- docs_present: yes
- priority: P2
- status: ACTIVE
- suggested_target_group: tooling
- recommended_action: keep_in_place
- rationale: Type inferred from path and package manifest; tests=yes, docs=yes.
- evidence_paths: projects/SWD-ARC/mcp/server/package.json, projects/SWD-ARC/mcp/server/README.md

### swd-mcp-server
- current_path: `projects/_archive/2026-03-03-workspace-reorg/absorbed-projects/SWD-mcp-server`
- type: archive
- language: JavaScript/TypeScript
- framework: NEEDS_REVIEW
- tests_present: yes
- docs_present: yes
- priority: P4
- status: ARCHIVE
- suggested_target_group: archive
- recommended_action: archive
- rationale: Type inferred from path and package manifest; tests=yes, docs=yes.
- evidence_paths: projects/_archive/2026-03-03-workspace-reorg/absorbed-projects/SWD-mcp-server/package.json, projects/_archive/2026-03-03-workspace-reorg/absorbed-projects/SWD-mcp-server/README.md

### wps-sif-tool
- current_path: `projects/_archive/2026-03-03-workspace-reorg/user-requested/wps-sif-tool`
- type: archive
- language: JavaScript/TypeScript
- framework: Next.js, Playwright, React
- tests_present: yes
- docs_present: yes
- priority: P4
- status: ARCHIVE
- suggested_target_group: archive
- recommended_action: archive
- rationale: Type inferred from path and package manifest; tests=yes, docs=yes.
- evidence_paths: projects/_archive/2026-03-03-workspace-reorg/user-requested/wps-sif-tool/package.json, projects/_archive/2026-03-03-workspace-reorg/user-requested/wps-sif-tool/README.md

### docsmith-licensing-service
- current_path: `projects/docsmith-licensing-service`
- type: docs
- language: JavaScript/TypeScript
- framework: Next.js, React
- tests_present: yes
- docs_present: yes
- priority: P1
- status: ACTIVE
- suggested_target_group: docs
- recommended_action: keep_in_place
- rationale: Type inferred from path and package manifest; tests=yes, docs=yes.
- evidence_paths: projects/docsmith-licensing-service/package.json, projects/docsmith-licensing-service/README.md

### docsmith-payment-gateway
- current_path: `projects/docsmith-payment-gateway`
- type: docs
- language: JavaScript/TypeScript
- framework: Next.js, React
- tests_present: yes
- docs_present: yes
- priority: P1
- status: ACTIVE
- suggested_target_group: docs
- recommended_action: keep_in_place
- rationale: Type inferred from path and package manifest; tests=yes, docs=yes.
- evidence_paths: projects/docsmith-payment-gateway/package.json, projects/docsmith-payment-gateway/README.md

### swd-pulse
- current_path: `projects/node-backend-starter`
- type: template
- language: JavaScript/TypeScript
- framework: Express, Mongoose
- tests_present: yes
- docs_present: yes
- priority: P3
- status: TEMPLATE
- suggested_target_group: templates
- recommended_action: move_to_normalized_group
- rationale: Type inferred from path and package manifest; tests=yes, docs=yes.
- evidence_paths: projects/node-backend-starter/package.json, projects/node-backend-starter/README.md

### node-backend-starter-v2
- current_path: `projects/node-backend-starter-v2`
- type: template
- language: JavaScript/TypeScript
- framework: Express, Prisma
- tests_present: yes
- docs_present: yes
- priority: P3
- status: TEMPLATE
- suggested_target_group: templates
- recommended_action: move_to_normalized_group
- rationale: Type inferred from path and package manifest; tests=yes, docs=yes.
- evidence_paths: projects/node-backend-starter-v2/package.json, projects/node-backend-starter-v2/README.md

### swd-docsmith-sif-extension
- current_path: `projects/swd-docsmith-sif-extension`
- type: extension
- language: JavaScript/TypeScript
- framework: Next.js, Playwright, React
- tests_present: yes
- docs_present: yes
- priority: P1
- status: ACTIVE
- suggested_target_group: extensions
- recommended_action: keep_in_place
- rationale: Type inferred from path and package manifest; tests=yes, docs=yes.
- evidence_paths: projects/swd-docsmith-sif-extension/package.json, projects/swd-docsmith-sif-extension/README.md

### swd-docsmith_brand-website
- current_path: `projects/swd-docsmith_brand-website`
- type: application
- language: JavaScript/TypeScript
- framework: Next.js, Playwright, React
- tests_present: yes
- docs_present: yes
- priority: P2
- status: ACTIVE
- suggested_target_group: applications
- recommended_action: keep_in_place
- rationale: Type inferred from path and package manifest; tests=yes, docs=yes.
- evidence_paths: projects/swd-docsmith_brand-website/package.json, projects/swd-docsmith_brand-website/README.md

### swd-finstack-mcp-server
- current_path: `projects/swd-finstack/mcp/server`
- type: tooling
- language: JavaScript/TypeScript
- framework: NEEDS_REVIEW
- tests_present: yes
- docs_present: no
- priority: P2
- status: ACTIVE
- suggested_target_group: tooling
- recommended_action: keep_in_place
- rationale: Type inferred from path and package manifest; tests=yes, docs=no.
- evidence_paths: projects/swd-finstack/mcp/server/package.json

### swd-landing
- current_path: `projects/swd-landing`
- type: application
- language: JavaScript/TypeScript
- framework: Next.js, React
- tests_present: yes
- docs_present: yes
- priority: P1
- status: ACTIVE
- suggested_target_group: applications
- recommended_action: keep_in_place
- rationale: Type inferred from path and package manifest; tests=yes, docs=yes.
- evidence_paths: projects/swd-landing/package.json, projects/swd-landing/README.md

### wps-hr-core
- current_path: `projects/wps-hr-core`
- type: service
- language: JavaScript/TypeScript
- framework: Next.js, React
- tests_present: yes
- docs_present: yes
- priority: P2
- status: ACTIVE
- suggested_target_group: services
- recommended_action: keep_in_place
- rationale: Type inferred from path and package manifest; tests=yes, docs=yes.
- evidence_paths: projects/wps-hr-core/package.json, projects/wps-hr-core/README.md

### swd-vault-dashboard
- current_path: `vault/dashboard`
- type: application
- language: JavaScript/TypeScript
- framework: Next.js, React
- tests_present: no
- docs_present: yes
- priority: P0
- status: ACTIVE
- suggested_target_group: applications
- recommended_action: keep_in_place
- rationale: Type inferred from path and package manifest; tests=no, docs=yes.
- evidence_paths: vault/dashboard/package.json, vault/dashboard/README.md

