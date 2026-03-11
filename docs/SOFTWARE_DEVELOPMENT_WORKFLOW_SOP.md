# Software Development Workflow SOP

Version: v1.0
Status: Active
Effective Date: 2026-02-25
Owner: SWD Operations

## Purpose

Define a single, deterministic software delivery workflow that reduces back-and-forth by enforcing clear intake, fixed acceptance criteria, and evidence-based gates.

## Scope

- Applies to software changes in this workspace.
- Aligns with external production governance roles and evidence expectations.
- Covers request intake through release closeout.

## Operating Principles

1. Fail-closed gates: no phase advances without required evidence.
2. One-pass readiness: work does not start until intake is complete.
3. Single source of truth: directive + acceptance criteria are authoritative.
4. Minimal recursion: max 3 implementation retries before escalation.
5. Evidence first: decisions and approvals reference artifacts, tests, and paths.

## Workflow Schema

| Phase | Owner | Required Input | Exit Criteria | Output |
| --- | --- | --- | --- | --- |
| P0 Intake | Requester + Axis | Problem statement, scope, constraints, deadline, risk | Definition of Ready (DoR) complete | Signed directive draft |
| P1 Plan Freeze | Axis | Directive draft, acceptance criteria, non-goals | Scope hash recorded, tasks sequenced, dependencies clear | Approved implementation plan |
| P2 Build | Forge | Approved plan, codebase context, test plan | Code changes complete and self-reviewed | PR-ready change set |
| P3 Verify | Forge + Sentinel | Built changes, test matrix, security checks | Required tests pass, no blocker findings | Evidence bundle |
| P4 Audit and Approval | Warden + Prime | Evidence bundle, risk summary, rollback notes | Approval decision issued (`approved|rejected|deferred`) | Release authorization |
| P5 Release and Closeout | Forge + Axis | Release authorization, deployment checklist | Deploy verified, docs updated, follow-ups logged | Closed work order |

## Definition of Ready (DoR) Contract

All fields are mandatory before P2 Build:

- Objective: one sentence measurable outcome.
- In scope: explicit list of allowed files/modules.
- Out of scope: explicit exclusions.
- Acceptance criteria: testable pass/fail list.
- Evidence requirements: required tests, paths, and hashes.
- Rollback expectation: how to revert if failure occurs.
- Decision owner: named approver for final acceptance.

## SOP Gate Checklists

### Gate G1 (P1 -> P2)

- Directive exists and is signed.
- Acceptance criteria are testable and unambiguous.
- Target paths are explicitly listed.
- Non-goals documented.

### Gate G2 (P2 -> P3)

- Change set maps to approved scope only.
- Local quality checks executed (`lint/static`, unit).
- No unresolved blocker comments in self-review.

### Gate G3 (P3 -> P4)

- Test matrix results attached.
- Security and policy checks attached.
- Evidence bundle contains:
  - `changes`
  - `tests`
  - `paths`
  - `directive_hash`

### Gate G4 (P4 -> P5)

- Approval decision recorded.
- Rollback plan validated.
- Release checklist acknowledged by release owner.

## Evidence Bundle Schema

```yaml
work_item_id: "WORK-YYYYMMDD-###"
directive_hash: "<hash>"
changes:
  - path: "<repo path>"
    summary: "<what changed>"
tests:
  - name: "<test or command>"
    result: "pass|fail"
    output_ref: "<artifact or log path>"
paths:
  - "<touched file path>"
risks:
  - "<residual risk>"
decision: "approved|rejected|deferred"
approved_by: "<role/name>"
timestamp_utc: "<ISO-8601>"
```

## No Back-and-Forth Control Rules

1. No implementation starts without DoR completion.
2. Clarification window is limited to one structured round during P0/P1.
3. New scope discovered during P2/P3 is split into a new work item unless critical.
4. Rework limit is 3 attempts; then escalate to Axis with options and tradeoffs.
5. Approval requests without evidence are auto-rejected.

## Communication Contract

Use this format for status and handoff updates:

- `From`
- `To`
- `Work Item`
- `Current Phase`
- `Delta Since Last Update`
- `Blockers`
- `Evidence Paths`
- `Next Action`
- `Next Owner`

## RACI (Condensed)

| Activity | Axis | Forge | Sentinel | Warden | Prime |
| --- | --- | --- | --- | --- | --- |
| Directive and scope | A/R | C | C | C | I |
| Implementation | C | A/R | I | I | I |
| Verification | C | R | A | C | I |
| Audit | I | C | C | A/R | I |
| Final approval | I | I | C | C | A/R |

## Change Control

Any change to this SOP requires:

1. New entry in `docs/DECISIONS.md`.
2. Updated version/effective date in this document.
3. Confirmation that gate criteria remain fail-closed.

