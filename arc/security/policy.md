# ARC Security Policy

## Secret Handling Rules
- No credential, secret, or private key may appear in any artifact, log, or execution output.
- All secrets must be managed through a secure vault service.

## Data Exposure Restrictions
- No production or sensitive data may be used in non-production environments without explicit masking and approval.

## External Integration Controls
- All external API calls must be authenticated and authorized.
- Dependencies on external services must be explicitly declared and approved.

## Dependency Risk Classification
- Dependencies are classified as: `trusted`, `untrusted`.
- `untrusted` dependencies require a full security scan before use.

## Security Violation Escalation
- Any detected security violation must be immediately escalated to Sentinel and Prime.
