# Self-Healing Advisory

## Intent
Provide faster operator recovery by recommending safe, evidence-based remediation playbooks.

## What It Does
- Detects recurring incident patterns.
- Suggests remediation playbooks with rollback checks.
- Scores reliability trends and chronic warning sources.
- Recommends recovery guidance by action mode.
- Captures incident lessons for prevention.

## What It Does Not Do
- Does not restart services automatically.
- Does not mutate repositories.
- Does not execute infrastructure changes autonomously.

## Operator Workflow
1. Review `/incidents` and `/reliability`.
2. Evaluate `/playbooks` for incident-specific guidance.
3. Check `/recovery-advice` action mode and prerequisites.
4. Approve only the actions you explicitly want to run.
5. Record incident learning with `/api/reliability/learning/record`.

## Approval Rule
All remediation playbooks and recovery suggestions require explicit operator approval.
