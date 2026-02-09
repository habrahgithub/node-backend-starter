# Security Policy

## Supported versions

- `1.2.x` - supported
- `1.1.x` - security fixes only

## Reporting a vulnerability

Report suspected vulnerabilities through your designated SWD security channel with:
- connector version
- deployment mode (Container App / Functions / local)
- reproduction steps
- impact assessment

Do not disclose publicly until SWD confirms remediation and release guidance.

## Security update policy

- Critical severity: patch target within 72 hours
- High severity: patch target within 7 days
- Medium severity: patch target within 30 days

## Secure defaults

- `MCP_DISABLED=0` (operator can set `1` for immediate shutdown)
- `SWD_PHASE_MODE=read_only`
- `SWD_ENABLE_WRITES=false`
- `Sites.Selected` with site-scoped grants only
- certificate auth preferred over client secret

