# Platform Governance Model

## Control Hierarchy
- Prime: final approval authority
- Axis: architecture veto and governance control
- ARC Console: unified operator control-plane surface

## Phase 6 Governance Posture
- Authentication boundary remains mandatory.
- Automation is operator-mediated, not autonomous.
- Integration adapters remain read-only by default.
- Service lifecycle commands remain simulation-only.
- Repository governance scans provide signals; they do not mutate repository state.

## Operator Action Discipline
- All action routes are protected by authenticated sessions.
- Action attempts must emit audit logs.
- Confirmation tokens are required for higher-risk simulated actions.
- Blocked actions are surfaced explicitly with machine-readable status.

## Safe vs Forbidden in Phase 6
Safe:
- read-only scans
- simulated diagnostics and restart actions
- predefined read-only workflows

Forbidden:
- autonomous destructive actions
- direct external repo mutation
- service control actions without safety confirmation
- bypassing authentication/audit requirements

## Evidence Paths
- `logs/operator-actions.log`
- `/api/logs` (`source: operator-action`)
- `/api/workflows`
- `/api/workflows/run`
- `/api/services/restart` (simulation mode)
