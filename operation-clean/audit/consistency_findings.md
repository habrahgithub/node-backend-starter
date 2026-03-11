# Consistency Findings

## Confirmed Consistencies
- `asset_registry.csv`, `classification_report.md`, `project_health_scorecard.md`, and `move_plan.csv` all cover 16 package-backed entries.
- Priority distribution is internally consistent across `asset_registry.csv` and `executive_summary.md`: `P0=3`, `P1=4`, `P2=4`, `P3=3`, `P4=2`.
- Status distribution is internally consistent across `asset_registry.csv` and `executive_summary.md`: `ACTIVE=11`, `TEMPLATE=3`, `ARCHIVE=2`.
- Archived items are kept logically separate from active items in both classification and planning outputs.

## Contradictions Found
- `projects/docsmith-licensing-service` is classified as type `docs` and targeted to `docs/`, but its README explicitly describes a live licensing service with API endpoints and migrations.
- `projects/docsmith-payment-gateway` is classified as type `docs` and targeted to `docs/`, but its README explicitly describes a live payment gateway service.
- `projects/node-backend-starter` is recorded under project name `swd-pulse`, which collides with the workspace root package and breaks project identity consistency.
- Two active entries share the same project name `swd-vault-dashboard` (`projects/SWD-ARC/apps/controls-center` and `vault/dashboard`) without an explained primary/legacy relationship.
- Two entries share the same project name `swd-mcp-server` (active ARC server and archived absorbed copy) without explicit identity disambiguation in the summary artifacts.
- `move_plan.csv` maps both `projects/SWD-ARC/mcp/server` and `projects/swd-finstack/mcp/server` to the same proposed path `tooling/server`, which is not executable as written.
- `tech_stack.md` reports `Playwright: 3`, but sampled manifests show 4 package-backed projects with Playwright present in runtime or dev tooling.
- `executive_summary.md` labels a section `Top 10 Remediation Actions` but lists only 5 items.

## Missing Links Between Artifacts
- `duplication_matrix.md` claims several overlaps using generic shared stack/name evidence, but `remediation_backlog.md` does not consistently distinguish weak overlap signals from evidence-backed consolidation candidates.
- `naming_normalization.md` does not address the duplicate project identities that materially affect `asset_registry.csv` and `move_plan.csv`.
- `project_health_scorecard.md` does not explain how score inflation was avoided when test evidence was script-based, absent, or mixed with smoke-only coverage.

## Project Count Validation
- Package-backed project roots found in workspace scan: 16.
- Registry rows: 16.
- Classification sections: 16.
- Scorecard sections: 16.
- Move-plan rows: 16.
- Count alignment is good; identity and labeling alignment is not.

## Summary Verdict
- Row-count consistency: PASS.
- Identity consistency: FAIL.
- Planning consistency: FAIL.
- Executive-summary consistency: WARN.
