# Target Structure

```text
/workspace
  platform/
  services/
  applications/
  extensions/
  templates/
  tooling/
  research/
  archive/
  docs/
```

## Mapping Principles
- P0 platform-core assets should remain easiest to locate and review.
- Product-facing deployables should live under `services/`, `applications/`, or `extensions/`.
- Templates and archived projects should be segregated to reduce active workspace noise.
- Docs remain centralized unless tightly bound to a single project.
