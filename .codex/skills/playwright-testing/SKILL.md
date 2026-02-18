---
name: playwright-testing
description: Run Playwright-based browser and end-to-end testing for UI flows, routing, regressions, and network behavior. Use when the user asks for Playwright tests, E2E checks, UI automation, or browser-based validation.
---

# Playwright Testing

## Scope

Use Playwright for browser-level validation in this workspace, including Next.js web apps and extension-adjacent flows where Playwright tests already exist.

## Workflow

1. Identify target project and existing Playwright config/specs.
2. Install Playwright browsers when missing.
3. Run one focused spec first to verify environment.
4. Run target suite for requested scope.
5. Collect failures with test name, step, and likely root cause.
6. Re-run only affected specs after fixes.

## Commands

- Run all tests: `npx playwright test`
- Run a file: `npx playwright test e2e/app.spec.js`
- Headed debug: `npx playwright test --headed --project=chromium`
- Single test by title: `npx playwright test -g "test name"`
- Trace on retry: `npx playwright test --trace on-first-retry`

## CI and Stability Rules

- Prefer headless execution for CI parity.
- Keep selectors stable (`data-testid` preferred for volatile UI).
- Avoid fixed sleeps; use Playwright waits/assertions.
- Isolate flaky external dependencies with mocks where possible.

## Output Rules

- Report pass/fail totals and failing test IDs.
- Include minimal reproduction command.
- For flaky failures, separate deterministic failures from intermittent ones.

## References

- `references/playwright-checklist.md`
