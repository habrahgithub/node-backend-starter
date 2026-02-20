# Test Gate Matrix (Release Verdict Template)

## Header

- Project:
- Path:
- Mode: fast|standard|full
- Stress Approval: approved|not-approved
- Timestamp:

## Results by Layer

- Lint/static: PASS|FAIL
- Sanity: PASS|FAIL
- Unit: PASS|FAIL
- Integration: PASS|FAIL
- System/E2E: PASS|FAIL
- Regression: PASS|FAIL
- Stress/load: PASS|FAIL|SKIPPED
- Governance/SOP/Env/State: PASS|FAIL

## Severity Grouping

### Blockers (Release must stop)

- Item:
- Why:
- Evidence path:
- Repro command:

### Warnings (Non-blocking)

- Item:
- Why:
- Mitigation:

### Skipped (Not Approved / Not Applicable)

- Item:
- Reason:

## Evidence

- Logs:
- Test reports:
- Playwright screenshots/videos:
- Artifact outputs:
- Git-ignore confirmation for generated artifacts:

## Final Verdict

Release Status: GREEN|YELLOW|RED
Reason:
