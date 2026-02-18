---
name: frontend-ui-implementation
description: Implement production-ready frontend UI from requirements or Figma designs using HTML5 semantics, CSS/Tailwind, and modern React/Next.js patterns. Use when building new pages/components, matching design specs, improving responsiveness, or polishing interaction quality.
---

# Frontend UI Implementation

## Scope

Build and refine UI in this workspace, especially Next.js app-router projects under `projects/`.

## Workflow

1. Identify target project and route/component boundaries before editing.
2. If a Figma URL or node is provided, extract layout and spacing first, then implement structure before styling details.
3. Build semantic HTML5 structure first (`header`, `main`, `section`, `nav`, `button`, `form`).
4. Apply responsive styling with mobile-first breakpoints.
5. Add purposeful motion only where it improves hierarchy and feedback.
6. Preserve existing project style language unless the request asks for a new direction.

## Implementation Rules

- Prefer clear component boundaries over long page files.
- Keep accessibility baseline: keyboard focus, labels, alt text, heading order, contrast.
- Avoid generic, interchangeable layouts when the request allows stronger visual direction.
- Keep interaction states explicit: loading, empty, error, success.

## Verification

1. Run project lint/build commands.
2. Verify desktop and mobile layouts.
3. Validate key user paths manually or with Playwright where available.

## References

- `references/qa-checklist.md`
