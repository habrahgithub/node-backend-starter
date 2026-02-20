# DocSmith Golden Pack Gate

Apply this gate for extension system/E2E checks.

## Required Steps

1. Generate SIF from golden input set.
2. Normalize timestamps or enforce deterministic clock.
3. Compare generated output with expected fixture.
4. Save evidence:
   - generated SIF path
   - comparison output
   - Playwright video/screenshot path

## Critical Risk Coverage

1. WPS format compliance
2. Totals + SCR correctness
3. Fail-closed behavior on malformed input

Any mismatch in golden comparison is a release blocker.
