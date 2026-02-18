---
name: unit-testing
description: Run and improve unit tests for isolated functions and modules with fast feedback. Use when the user asks for unit testing, test coverage for logic changes, or prevention of local regressions.
---

# Unit Testing

## Workflow

1. Identify changed modules and adjacent logic.
2. Run targeted unit tests first.
3. Add or update tests for new behavior and edge cases.
4. Run full unit suite for the target project.
5. Report failures with root-cause hypotheses.

## Rules

- Keep tests deterministic and isolated.
- Mock external services and time/random sources.
- Prefer behavior assertions over implementation details.

## Output Rules

- Show failing test names first.
- Include minimal reproduction command.
- Note missing coverage areas explicitly.

## Reference

- `references/unit-test-patterns.md`
