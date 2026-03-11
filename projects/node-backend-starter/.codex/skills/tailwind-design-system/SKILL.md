---
name: tailwind-design-system
description: Build and maintain a reusable Tailwind-based design system with tokens, component variants, and consistent spacing/typography rules. Use when creating or refactoring shared UI foundations, theming, or standardizing styling across pages.
---

# Tailwind Design System

## Scope

Create consistent styling primitives for Tailwind projects in this workspace.

## Workflow

1. Define design tokens first (color, spacing, radius, typography, shadows).
2. Store core tokens as CSS variables in global styles.
3. Map reusable token sets into Tailwind theme extensions.
4. Create component patterns with stable variant APIs.
5. Replace repeated utility clusters with reusable component abstractions.

## Rules

- Prefer tokenized classes over arbitrary values.
- Keep naming consistent and domain-focused (`surface`, `accent`, `muted`, `danger`).
- Use responsive and state variants deliberately, not by duplication.
- Minimize one-off inline styles.

## Component Strategy

- Separate primitives (Button, Input, Card) from feature components.
- Keep variant combinations explicit and testable.
- Document class contracts for each shared primitive.

## Verification

1. Check visual consistency across pages.
2. Verify dark/light behavior only if the project supports both.
3. Run lint/build and inspect generated CSS footprint for regressions.

## References

- `references/token-template.md`
