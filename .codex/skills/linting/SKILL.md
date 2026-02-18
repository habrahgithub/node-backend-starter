---
name: linting
description: Run static linting and formatting checks across projects and report actionable issues. Use when the user asks for lint, style checks, formatter checks, or pre-commit code quality validation.
---

# Linting

## Workflow

1. Detect target project and language stack.
2. Run the narrowest lint command first for changed files when possible.
3. Run full lint script for the target project.
4. Report findings grouped by file and rule.
5. Apply safe autofix only when requested.

## Common Commands

- JavaScript/TypeScript: `npm run lint`
- Format check: `npm run format:check`
- ESLint direct: `npx eslint .`
- .NET analyzers/build validation: `dotnet build`

## Output Rules

- Show failing files and top rule violations first.
- Avoid pasting full logs; keep concise excerpts.
- Suggest minimal code changes to resolve violations.

## Reference

- `references/linting-checklist.md`
