# Amendment Instruction and Change Control Protocol

- Purpose: prevent uncontrolled change, preserve architectural integrity, and maintain auditability of SWD OS.
- Scope: applies to SWD OS, all governance docs, operating protocols, agent instructions, and execution artifacts.
- Rule: any change outside this protocol is invalid.

## Authority

- Prime: final authority on intent and governance; approves or rejects amendments after Axis review.
- Axis: system architect; structures amendments, reviews systemic impact, and approves for escalation or rejects proposals.
- Forge (and other execution agents): no amendment authority; may submit change requests only; executes after approval.

## Valid triggers

- Role ambiguity or boundary confusion.
- Execution drift or repeated failure patterns.
- Scaling introduces new constraints.
- Audit, compliance, legal, or security risk is identified.
- Duplication or redundancy exists.
- A new system capability is introduced.
- Prime explicitly requests a change.

Not valid
- Convenience or speed.

## Lifecycle (mandatory)

1. Proposal (Prime or Axis)
   - Must include: title, reason, affected artifacts, risk of not amending, risk introduced by amending.
   - Use: templates/AMENDMENT_PROPOSAL.md.
2. Axis architectural review
   - Checks: system consistency, operating loop impact, role boundary violations, scalability, audit implications.
   - Outcomes: approve for escalation, revise and resubmit, or reject (with reason recorded).
3. Prime approval
   - States: approved, approved with revision, or rejected (with reason). No silent approvals.
4. Controlled implementation
   - Update the canonical artifact only; avoid duplicated policy text.
   - Archive prior versions and mark them superseded with date and link.
   - Record the amendment in the change log and (when applicable) Decision Log.
5. System lock
   - After publication, further changes require a new amendment cycle.
   - Notify execution agents of the new authoritative version.

## Prohibited actions (governance breach)

- Silent edits.
- "Minor" changes without approval.
- Duplicate canonical documents.
- Execution agents making design decisions.
- Overwriting instead of archiving.
- Retroactive justification.
- Editing governance to ease execution.

## Versioning and audit trail

- Each amended artifact must include: version, date, reason, approved by, and superseded reference (if applicable).
- Repo versioning: follow VERSIONING.md.

## References

- Authority: constitution/AUTHORITY.md
- Roles: constitution/ROLES.md
- Proposal template: templates/AMENDMENT_PROPOSAL.md
- Axis review template: templates/AXIS_REVIEW.md
- Execution evidence template: templates/FORGE_EVIDENCE.md
