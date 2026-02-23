---
name: nextjs-component-patterns
description: Apply robust Next.js App Router component patterns for server/client boundaries, data fetching, route handlers, and page composition. Use when building or refactoring Next.js features, APIs, and shared components.
---

# Next.js Component Patterns

## Scope

Guide architecture and implementation in Next.js projects using App Router.

## Workflow

1. Start server-first: use Server Components unless interactivity requires client runtime.
2. Add `use client` only for state, effects, browser APIs, or event-heavy interactions.
3. Keep data fetching close to server boundaries.
4. Keep route handlers focused on validation, auth, and response formatting.
5. Isolate reusable UI into shared components with stable props.

## Patterns

- Co-locate route segments with feature-specific UI and helpers.
- Keep API contracts explicit and versionable.
- Use loading/error boundaries for long-running paths.
- Prefer composition over monolithic page files.

## Performance and UX

- Stream or progressively render where useful.
- Use memoization/dynamic imports only after measurable need.
- Keep bundle growth in check when adding client-side libraries.

## Verification

1. Run lint, tests, and build for touched project.
2. Validate route behavior (happy path + invalid input path).
3. Check SSR/client hydration behavior after component boundary edits.

## References

- `references/app-router-checklist.md`
