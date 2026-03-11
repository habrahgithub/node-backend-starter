---
name: penetration-testing
description: Perform authorized penetration testing workflows to identify exploitable security weaknesses in applications and APIs. Use when the user explicitly requests penetration testing, offensive security validation, or controlled exploit assessment.
---

# Penetration Testing

## Authorization Rules

1. Confirm explicit permission and approved target scope.
2. Confirm testing window and environment.
3. Exclude unauthorized systems and third-party assets.
4. Avoid destructive or irreversible actions unless explicitly approved.

## Workflow

1. Run reconnaissance and attack-surface mapping.
2. Test common web/API weaknesses systematically.
3. Attempt controlled exploitation only within scope.
4. Capture reproducible evidence for each finding.
5. Provide risk severity, exploit path, and remediation guidance.

## Coverage Areas

- Authentication and session handling.
- Access control and privilege escalation.
- Input validation and injection vectors.
- Sensitive data exposure and secret leakage.
- Security headers and transport protections.

## Output Rules

- Report findings by severity first.
- Include proof steps and expected secure behavior.
- Provide minimal, actionable mitigation for each issue.

## Reference

- `references/pentest-checklist.md`
