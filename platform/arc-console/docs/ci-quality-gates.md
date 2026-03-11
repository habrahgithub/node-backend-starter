# CI Quality Gates

## Objective
Restore and enforce quality-gate discipline for `arc-console` with lint, test, and build checks.

## Implemented Baseline

### Lint recovery
- Added ESLint 9 flat config:
  - `eslint.config.mjs`
- Updated npm script:
  - `npm run lint`

### Test command normalization
- Added deterministic Node test command:
  - `npm run test`
- Baseline test suite:
  - `tests/auth.test.js`

### Build validation
- Existing dashboard build gate:
  - `npm run dashboard:build`

### Unified verify command
- Added:
  - `npm run verify`
  - sequence: lint -> test -> dashboard build

## CI Workflow
- Workflow file:
  - `.github/workflows/arc-console-quality.yml`
- Triggered on push/PR changes affecting `platform/arc-console/**`
- Executes:
  1. `npm ci`
  2. `npm run lint`
  3. `npm run test`
  4. `npm run dashboard:build`

## Branch Protection Recommendation
Apply repository branch protection with required status checks:
- `arc-console-quality / quality-gates`

Required policy:
- block merge on failed checks
- require up-to-date branch before merge
- require at least one review

## Known Limits
- Branch protection enforcement is a repository setting and must be applied in hosting platform controls.
