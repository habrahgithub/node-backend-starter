# ARC Governance Ruleset

## Actor Authority Hierarchy
Prime → Axis → Warden → Forge → Sentinel

## Scope Enforcement Rules
- Task scope must strictly match the approved Axis directive.
- No scope expansion is permitted without Prime approval.

## Directive Validation Protocol
- All tasks must reference a valid, registered Axis Directive ID.

## Execution Authorization Conditions
- No task execution may proceed without an Axis directive reference and a valid Warden authorization token.

## Escalation Thresholds
- Governance conflicts must be escalated to Prime.
- Directive ambiguity must be escalated to Prime.
- Rework attempts exceeding three (3) cycles for a single directive must be escalated to Prime.

## Fail-Closed Operational Policy
- All systems must operate in a fail-closed mode.
- In case of ambiguity, error, or missing evidence, execution must HALT.
