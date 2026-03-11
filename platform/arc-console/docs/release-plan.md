# ARC Console Release Plan

## Release Objective
Establish controlled internal release discipline for ARC Console through Phase 13 governance maturity work.

## Versioning
- Use semantic versioning for internal releases (`v0.x.y` until production hardening completes).
- Current target: `v0.13.0-internal-rc1` (Phase 13 autonomous governance baseline).

## Release Gates
A release candidate must satisfy:
1. Auth boundary active and verified.
2. Protected-route behavior validated (`401`/redirect paths).
3. Endpoint smoke tests passing for all declared routes.
4. Dashboard pages rendering with no fatal errors.
5. Observability endpoints returning structured data.
6. Documentation updated:
   - `security-model.md`
   - `observability.md`
   - `api-contract.md`
   - `operator-runbook.md`
7. Copilot contract validation:
   - `POST /api/copilot/query` response shape
   - copilot suggestion/history endpoints
   - advisory-only behavior and confidence/evidence fields
8. Fabric contract validation:
   - node registration duplicate/auth checks
   - heartbeat and telemetry node-token checks
   - distributed query/topology endpoint behavior under empty and active node states
9. Governance contract validation:
   - policy registry shape and threshold overrides
   - policy evaluation and evidence output
   - compliance/drift/violation route responses and dashboard rendering

## Changelog Discipline
Maintain a changelog entry per internal release with:
- Added
- Changed
- Fixed
- Security

Minimum record fields:
- release tag
- date
- scope summary
- evidence paths
- known limitations

## Candidate Packaging Flow (Local)
1. Install dependencies.
2. Run syntax/build checks.
3. Execute runtime smoke tests.
4. Save evidence under `/tmp/arc-console-*` and summarize in docs.
5. Create release note section in changelog.

## Rollback Guidance
If regression is detected:
- revert to previous tag/version
- invalidate active sessions by rotating `ARC_SESSION_SECRET`
- re-run smoke tests before re-promoting

## Deferred for Future Release
- SSO/RBAC
- external observability backend integration
- production deployment profile
- write-action controls with approval gates
