# Artifact Completeness Report

| path | exists | non_empty | quality | notes |
|---|---|---|---|---|
| `/home/habib/workspace/operation-clean/discovery/workspace_tree.md` | yes | yes | WARN | Usable, but rendered as a flat path listing rather than a human-readable tree. |
| `/home/habib/workspace/operation-clean/discovery/file_inventory.csv` | yes | yes | PASS | Large non-placeholder inventory; sampled only due size (6,161 lines). |
| `/home/habib/workspace/operation-clean/discovery/dependency_map.md` | yes | yes | PASS | Non-placeholder package-backed dependency summary. |
| `/home/habib/workspace/operation-clean/discovery/tech_stack.md` | yes | yes | WARN | Usable, but framework counts are not fully consistent with sampled manifests; Playwright appears undercounted. |
| `/home/habib/workspace/operation-clean/discovery/risk_flags.md` | yes | yes | WARN | Non-placeholder, but misses some downstream classification/planning risks surfaced elsewhere. |
| `/home/habib/workspace/operation-clean/classification/asset_registry.csv` | yes | yes | WARN | Structured and usable, but contains several evidence-quality and identity issues. |
| `/home/habib/workspace/operation-clean/classification/classification_report.md` | yes | yes | WARN | Complete enough to review, but some labels are contradicted by README/package evidence. |
| `/home/habib/workspace/operation-clean/analysis/duplication_matrix.md` | yes | yes | WARN | Table is present, but multiple overlap claims rely on generic shared stack/name signals rather than purpose-level evidence. |
| `/home/habib/workspace/operation-clean/analysis/project_health_scorecard.md` | yes | yes | WARN | Non-placeholder, but scoring appears heuristic and sometimes overconfident relative to direct evidence. |
| `/home/habib/workspace/operation-clean/analysis/naming_normalization.md` | yes | yes | WARN | Minimal and usable, but too thin to resolve duplicate identities or ambiguous destinations. |
| `/home/habib/workspace/operation-clean/planning/target_structure.md` | yes | yes | WARN | High-level structure exists, but lacks dependency/ownership rules needed for safe execution. |
| `/home/habib/workspace/operation-clean/planning/move_plan.csv` | yes | yes | FAIL | CSV exists, but proposed targets include misclassified live services and at least one destination collision (`tooling/server`). |
| `/home/habib/workspace/operation-clean/planning/remediation_backlog.md` | yes | yes | WARN | Actionable format, but several items inherit weak duplication/classification assumptions. |
| `/home/habib/workspace/operation-clean/final/executive_summary.md` | yes | yes | WARN | Usable summary, but it inherits upstream inaccuracies and labels `Top 10` while listing 5 actions. |

## Completeness Verdict
- 14 of 14 required artifacts exist.
- 14 of 14 required artifacts are non-empty.
- 1 artifact is quality `FAIL`.
- 10 artifacts are quality `WARN`.
- The artifact set is complete enough to audit, but not clean enough to execute without review.
