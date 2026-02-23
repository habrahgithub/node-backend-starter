---
name: security-sentinel
description: Continuously guard project security posture by checking risky changes, auth boundaries, secrets handling, and dependency risk signals. Use when the user asks for security checks, hardening passes, or pre-release security review.
---

# Security Sentinel

## Workflow

1. Identify security-relevant changes (auth, tokens, input validation, data access).
2. Scan for secret exposure risks and insecure defaults.
3. Check dependency and script risk indicators.
4. Validate endpoint protections and role boundaries.
5. Summarize findings by severity and remediation priority.

## Security Focus Areas

- Token and credential storage/rotation discipline.
- AuthN/AuthZ boundaries and role checks.
- Input validation and injection-resistant handling.
- Sensitive data exposure in logs, responses, and config.
- Unsafe test/dev bypasses leaking into production paths.

## Output Rules

- Report findings first, ordered by severity.
- Include affected file paths and expected secure behavior.
- Provide minimal remediation steps.

## Reference

- `references/security-gate.md`
