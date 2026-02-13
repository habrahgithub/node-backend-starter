# Changelog

## 2026-02-12

### PULSE-S1 - Foundations (Safety First)
- Created solution architecture:
  - `DocSmith.Pulse.Web`
  - `DocSmith.Pulse.Core`
  - `DocSmith.Pulse.Infrastructure`
- Implemented SQLite EF Core data model:
  - `SafetyState`, `AuditLog`, `ContentIdea`, `ContentDraft`, `EngagementTarget`, `Campaign`, `ActivityLog`, `BrandVoice`, `UserProfile`, `MediaAsset`
- Added global safety enforcement:
  - `PulseSafetyMiddleware`
  - `[RequiresPulseEnabled]`
  - Kill switch block logging with reason `KillSwitch`
- Added admin governance pages:
  - `/Admin/Safety`
  - `/Admin/Audit` (with action filter)
- Implemented core workflow pages:
  - `/Ideas`, `/Drafts`, `/Engagement`, `/DailyPulse`, `/Logs`
- Added immutable audit log enforcement in DbContext.

### PULSE-S2 - Professional Mode
- Added state machine rules (`ContentWorkflow`) and server-side transition checks.
- Added campaign workflows:
  - `/Campaigns`
  - 7-day pack generation
- Added weekly calendar scheduling:
  - `/Calendar`
- Added draft export with optional watermark.

### Media Studio Extension
- Added `/MediaStudio` for internet media discovery and creative generation workflows.
- Added Openverse internet media search service (images/videos).
- Added creative generation service:
  - image generation (OpenAI optional)
  - video brief generation (AI/template)
  - mermaid diagram generation (AI/template)
- Added `MediaAsset` persistence for traceability.

### Governance Artifacts
- Added `README.md`
- Added `EVIDENCE.md`
- Added SQL migration script: `db/001_initialprototype.sql`
