# Governance Architecture

## Objective
Phase 13 introduces a policy-driven governance engine that evaluates platform state across the distributed control fabric and reports advisory remediation guidance.

## Governance Modules
- `server/governance/policyRegistry.js`
  - default policy set
  - optional policy overrides from file
  - active/disabled policy listing
- `server/governance/policyEvaluator.js`
  - evidence-backed policy evaluation
  - pass/violation/needs-review status generation
- `server/governance/driftDetector.js`
  - node/service/repository drift signals
  - severity classification and remediation guidance
- `server/governance/complianceScorer.js`
  - overall and domain compliance scoring
  - local compliance trend history
- `server/governance/violationReporter.js`
  - aggregated violation inventory with advisory actions

## API Surface
Protected governance endpoints:
- `GET /api/governance/summary`
- `GET /api/governance/policies`
- `GET /api/governance/evaluate`
- `GET /api/governance/drift`
- `GET /api/governance/compliance`
- `GET /api/governance/violations`

## Integration Surface
- Intelligence layer consumes governance violations/compliance in platform insights.
- Copilot layer can load governance policy/evaluation/drift/compliance/violation context.
- Dashboard pages expose governance state through read-only views.

## Safety Guarantees
- Governance evaluation is advisory-first and read-only by default.
- Every policy violation and drift finding includes evidence.
- Recommended remediation actions are operator-approval-required.
- Missing telemetry or partial evaluation failures degrade to safe needs-review outputs.
