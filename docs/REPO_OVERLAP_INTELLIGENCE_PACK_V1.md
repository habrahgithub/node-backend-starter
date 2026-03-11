# Repo Overlap Intelligence Pack v1

- Generated: 2026-02-20
- Scope: local-first `projects/*` git roots in this workspace (connector repos excluded)
- Method: cross-repo file hash + same-relative-path analysis
- Exclusions: `.git`, `node_modules`, `.next`, `dist`, `build`, `coverage`, `output`, `bin`, `obj`, `.venv`

## Inventory Snapshot

- Repos scanned: `9`
- File rows analyzed: `5082`
- Categories:
  - Next.js repos: `5`
    - `projects/docsmith-licensing-service`
    - `projects/docsmith-payment-gateway`
    - `projects/swd-docsmith-sif-extension`
    - `projects/swd-docsmith_brand-website`
    - `projects/swd-landing`
  - Browser extension repo (canonical): `1`
    - `projects/swd-docsmith-sif-extension`
  - Service repos (Node): `4`
    - `projects/docsmith-licensing-service`
    - `projects/docsmith-payment-gateway`
    - `projects/node-backend-starter`
    - `projects/node-backend-starter-v2`
  - Service repos (.NET): `1`
    - `projects/DocSmith.Pulse`
  - Docs/governance-only repos: `1`
    - `projects/swd-os-governance`

Note: `projects/swd-docsmith_brand-website` contains extension `manifest.json` only under `output/*` artifacts, so it is not treated as the canonical extension source repo.

## Duplicate Group Counts

- Exact-content duplicate groups across repos: `29`
- Same-relative-path groups across repos: `111`
  - Drifted (same path, different content): `87`
  - Aligned (same path, same content): `24`

## Drifted Clones (High Risk)

- `swd-docsmith-sif-extension` vs `swd-docsmith_brand-website`
  - Overlapping relpaths: `86`
  - Aligned: `25`
  - Drifted: `61`
  - Risk: high. Two near-clone product trees are diverging at speed.
- `docsmith-licensing-service` vs `docsmith-payment-gateway`
  - Overlapping relpaths: `17`
  - Aligned: `2`
  - Drifted: `15`
  - Risk: high. Shared service skeletons drift in security/config paths.
- `node-backend-starter` vs `node-backend-starter-v2`
  - Overlapping relpaths: `8`
  - Aligned: `0`
  - Drifted: `8`
  - Risk: medium. Template forks are now independent variants.

## Top 10 Shared-Library Candidates

1. `projects/swd-docsmith-sif-extension/src/knowledge/bankAliases.json`
   Why: identical domain knowledge file in both extension and brand website.
2. `projects/swd-docsmith-sif-extension/src/knowledge/fields.json`
   Why: schema-like metadata duplicated exactly in both repos.
3. `projects/swd-docsmith-sif-extension/src/knowledge/uiCopy.json`
   Why: shared copy payload likely belongs in a common package.
4. `projects/swd-docsmith-sif-extension/src/knowledge/validationRules.json`
   Why: policy/rules should have one canonical source.
5. `projects/swd-docsmith-sif-extension/src/lib/dataProcessing.js`
   Why: core transformation logic is byte-identical across both repos.
6. `projects/swd-docsmith-sif-extension/src/lib/draftSchema.js`
   Why: schema logic duplicated; high leverage for extraction.
7. `projects/swd-docsmith-sif-extension/src/components/v2/ValidationSummaryCard.jsx`
   Why: shared UI component duplicated exactly.
8. `projects/swd-docsmith-sif-extension/src/components/v2/IssuesSummaryCard.jsx`
   Why: shared UI logic and rendering behavior duplicated exactly.
9. `projects/swd-docsmith-sif-extension/src/components/v2/StatusStrip.jsx`
   Why: shared status UI duplicated exactly.
10. `projects/swd-docsmith-sif-extension/scripts/zip-clean.sh`
    Why: build/distribution helper duplicated exactly.

## Consolidation Roadmap (Non-Destructive)

## Phase 1 (Safe extraction)

- Extract read-only shared knowledge payloads first:
  - `src/knowledge/*.json`
  - `src/lib/draftSchema.js`
- Publish as local package (for example `@swd/shared-sif-knowledge`).
- Consume from both repos behind compatibility wrappers.

## Phase 2 (Code reuse)

- Extract stable shared utilities/components:
  - `src/lib/dataProcessing.js`
  - `src/components/v2/{ValidationSummaryCard,IssuesSummaryCard,StatusStrip}.jsx`
- Add smoke tests in both consuming repos before and after extraction.

## Phase 3 (Template discipline)

- Freeze one canonical service scaffold for licensing/payment.
- Mark `node-backend-starter` and `node-backend-starter-v2` as template-only with explicit deprecation policy.
- Route all new services through one blessed template baseline.

## Phase 4 (Governance enforcement)

- Add overlap drift checks in CI for selected canonical relpaths.
- Fail only on protected paths at first; report-only for all others.
- Append Vault `decision` event when canonical ownership is changed.

## Operational Update — 2026-03-11

- Audit scope expanded to all visible git roots in the workspace, including the workspace root and archived project clones.
- Evidence bundle: `artifacts/repo-cleanup/20260311T000000Z/`
- Verified duplicate origin mapping:
  - `https://github.com/habrahgithub/node-backend-starter`
    - `.`
    - `projects/node-backend-starter`
- Non-destructive reconciliation completed:
  - Fast-forwarded `projects/node-backend-starter` from `0b1b177` to `e0304f7`.
  - Reconciled the parent gitlink pointer and pushed root commit `ce3edd9`.
- Current operational state:
  - Duplicate clone still exists locally and remains the primary trim candidate.
  - The shared root/nested remote creates self-referential pointer churn: each root gitlink-sync commit advances the same remote used by `projects/node-backend-starter`, which can make the nested clone appear behind again immediately after reconciliation.
  - `projects/node-backend-starter` is currently `behind=1` versus the latest remote for that reason.
  - Unrelated dirty working trees were present during the audit and were not modified by this cleanup pass:
    - `.`
    - `projects/SWD-ARC`

### Recommended immediate handling

- Treat the workspace root (`.`) as the current aggregate source of truth for gitlink reconciliation.
- Treat `projects/node-backend-starter` as a duplicate working clone pending explicit trim, archive, or structural migration approval.
- Do not perform destructive removal while unrelated dirty working trees remain in the workspace.
