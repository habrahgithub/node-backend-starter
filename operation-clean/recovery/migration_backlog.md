# Migration Backlog

Blocked filesystem rows have been converted into migration-grade work items or logical-only handling.

## Critical

- ID: RPL-001
- Title: Launch ARC control-plane migration project
- Affected item: swd-arc-controls-center
- Migration type: dashboard consolidation
- Blocking reason: Current target is outside the SWD-ARC repo and overlaps the future unified ARC control plane.
- Evidence: Recovery move plan v3 classifies `swd-arc-controls-center` as `MIGRATION_PROJECT_REQUIRED`; preflight showed subdirectory extraction risk and dirty SWD-ARC state.
- Recommended path forward: Create a dedicated ARC console migration project that defines repo ownership, extraction mechanics, and the relationship to `vault/dashboard`.
- Requires Prime approval: yes

- ID: RPL-002
- Title: Disentangle embedded legacy starter repo
- Affected item: node-backend-starter
- Migration type: repo consolidation
- Blocking reason: The path is an embedded repo while the workspace root also tracks regular files inside it.
- Evidence: Preflight boundary audit marked `projects/node-backend-starter` as `embedded_repo_tracked_by_root`.
- Recommended path forward: Run a dedicated repo-boundary cleanup and decide whether the legacy starter stays as a separate repo, becomes archive-only, or is absorbed after provenance is preserved.
- Requires Prime approval: yes

## High

- ID: RPL-003
- Title: Design gitlink-backed repo relocation pattern for live services and applications
- Affected item: docsmith-licensing-service; docsmith-payment-gateway; swd-docsmith-sif-extension; swd-docsmith-brand-website; swd-landing; wps-hr-core; node-backend-starter-v2
- Migration type: repo relocation
- Blocking reason: These candidates are nested repos tracked by the workspace root as gitlinks, so path normalization is really repo relocation.
- Evidence: Preflight repo inventory and move-plan execution-ready CSV flagged each path as a gitlink-backed nested repo with no simple-move readiness.
- Recommended path forward: Define a standard repo relocation runbook that covers workspace-root gitlinks, nested repo cleanliness, and post-move reference validation.
- Requires Prime approval: yes

- ID: RPL-004
- Title: Split ARC subdirectories only through repo extraction work
- Affected item: arc-axis-adapter; swd-arc-mcp-server
- Migration type: repo split
- Blocking reason: Both items are subdirectories inside the SWD-ARC repo and cannot be normalized by `mv` without extracting them from their parent repository.
- Evidence: Preflight boundary audit classified both rows as subdirectory extraction blockers under `projects/SWD-ARC`.
- Recommended path forward: Treat these as optional repo-split candidates with explicit ownership, history-preservation, and SWD-ARC dependency review.
- Requires Prime approval: yes

- ID: RPL-005
- Title: Resolve `vault/dashboard` architecture decision before any move
- Affected item: vault-dashboard-legacy
- Migration type: dashboard consolidation
- Blocking reason: The approved plan already marked the row for consolidation review before any move.
- Evidence: move_plan_v2 action `review_for_consolidation`; preflight segment `NEEDS_PRIME_DECISION`.
- Recommended path forward: Decide whether `vault/dashboard` remains separate tooling, becomes backend-only, or enters a future consolidation project with the ARC control plane.
- Requires Prime approval: yes

## Medium

- ID: RPL-006
- Title: Stabilize root repo to unlock the only same-repo candidate
- Affected item: swd-finstack-mcp-server
- Migration type: clean baseline then move
- Blocking reason: The row is inside the workspace root repo and could become a simple move later, but the source path is currently dirty.
- Evidence: Recovery move plan v3 marks it `DIRTY_STATE_BLOCKED` with `SAFE_AFTER_CLEAN_BASELINE` readiness.
- Recommended path forward: Create a clean root baseline, then re-evaluate this row as a standalone same-repo filesystem action.
- Requires Prime approval: no

## Low

- ID: RPL-007
- Title: Retain archive items as logical-only classifications
- Affected item: swd-mcp-server-archive-copy; wps-sif-tool-archive
- Migration type: archive transition
- Blocking reason: Physical movement of already-archived nested repos provides little governance value and creates git-boundary churn.
- Evidence: Recovery move plan v3 classifies both rows as `ARCHIVE_LOGICAL_ONLY`.
- Recommended path forward: Keep archive labels in governance artifacts and revisit physical consolidation only if archive-storage policy later requires it.
- Requires Prime approval: no
