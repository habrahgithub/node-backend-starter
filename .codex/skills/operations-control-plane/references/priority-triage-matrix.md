# Priority Triage Matrix (Impact / Risk / Effort)

## Scoring Rules

- Impact:
  - High: payroll correctness, licensing integrity
  - Medium: core workflow reliability
  - Low: cosmetic/non-critical UX
- Risk:
  - High: compliance failure, data loss, security exposure
  - Medium: degraded reliability, rollback risk
  - Low: minor inconsistency
- Effort:
  - Low: <1h
  - Medium: 1-4h
  - High: >4h

## Issue Scoring Template

- Issue:
- Scope:
- Impact: High|Medium|Low
- Risk: High|Medium|Low
- Effort: High|Medium|Low
- Tier: NOW|NEXT|LATER
- Evidence path:
- Owner:

## Tiering Heuristic

1. NOW:
   - Any blocker or compliance/security issue
   - High impact + high risk regardless of effort
2. NEXT:
   - High impact with medium/low risk
   - Medium impact that improves release confidence
3. LATER:
   - Low impact optimization and refactors
