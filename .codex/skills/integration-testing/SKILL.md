---
name: integration-testing
description: Validate interactions between services, APIs, databases, and external dependencies. Use when the user asks for integration tests, end-to-end service validation, or cross-system contract checks.
---

# Integration Testing

## Workflow

1. Confirm required dependent services are running.
2. Seed or prepare integration test data.
3. Run integration suite for the target service.
4. Verify API contracts, database side effects, and downstream calls.
5. Clean up test data and summarize compatibility issues.

## Rules

- Use dedicated test environments or isolated local stacks.
- Keep contract assertions explicit (status, schema, critical fields).
- Avoid fragile timing assumptions; use bounded retries when needed.

## Output Rules

- Separate environment/setup failures from code failures.
- Show failing boundary (API, DB, queue, external service).
- Include exact command to reproduce.

## Reference

- `references/integration-checklist.md`
