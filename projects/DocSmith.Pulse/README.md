# DocSmith Pulse

DocSmith Pulse is a local-first, organization-safe digital marketing operations console (LinkedIn-first).

## Safety Contract

- No LinkedIn platform automation.
- No feed scraping.
- No auto-like, auto-comment, auto-follow, auto-connect, or auto-DM.
- Manual copy/paste publishing workflow.
- Global Kill Switch + Organization Safe Mode enforcement.
- Immutable append-only audit logging.

## Architecture

- `DocSmith.Pulse.sln`
- `src/DocSmith.Pulse.Web` (Razor Pages UI)
- `src/DocSmith.Pulse.Core` (entities, enums, interfaces, workflow rules)
- `src/DocSmith.Pulse.Infrastructure` (EF Core SQLite, services, middleware wiring)

## Features

### Phase 1 (Foundations)
- Safety controls:
  - `/Admin/Safety` (Kill Switch, Safe Mode, AI toggle, Scheduler toggle, Exports toggle)
  - `/Admin/Audit` (append-only audit log viewer with action filter)
- Core workflow pages:
  - `/Ideas`
  - `/Drafts`
  - `/Engagement`
  - `/DailyPulse`
  - `/Logs`
- Kill switch middleware blocks protected mutating handlers server-side and logs blocked attempts.

### Phase 2 (Professional Mode)
- Brand voice profile and prohibited claims storage.
- State machine enforcement:
  - `Idea -> Drafted -> Approved -> Scheduled -> Posted -> Archived`
- Weekly scheduling view:
  - `/Calendar`
- Campaign workflows:
  - `/Campaigns`
  - 7-day campaign pack generation.
- Export `.md` from drafts (subject to safety controls).

### Media Studio (Internet + Creative)
- `/MediaStudio`
- Internet media discovery (Openverse):
  - Image suggestions
  - Video suggestions
- Creative generation workflows:
  - Image generation (OpenAI optional; fallback guidance if unavailable)
  - Video brief generation (AI/template)
  - Mermaid workflow diagram generation (AI/template)
- Media actions are logged and safety-controlled.

## Prerequisites

- .NET 8 SDK
- SQLite (`sqlite3`) optional for direct inspection

This repo includes a local SDK in `.dotnet/` for consistent execution.

## Run

```bash
cd /home/habib/workspace/DocSmith.Pulse
./.dotnet/dotnet run --project src/DocSmith.Pulse.Web/DocSmith.Pulse.Web.csproj
```

## Database & Migrations

Apply migrations:

```bash
./.dotnet/dotnet dotnet-ef database update \
  --project src/DocSmith.Pulse.Infrastructure/DocSmith.Pulse.Infrastructure.csproj \
  --startup-project src/DocSmith.Pulse.Web/DocSmith.Pulse.Web.csproj \
  --context PulseDbContext
```

Create migration:

```bash
./.dotnet/dotnet dotnet-ef migrations add <Name> \
  --project src/DocSmith.Pulse.Infrastructure/DocSmith.Pulse.Infrastructure.csproj \
  --startup-project src/DocSmith.Pulse.Web/DocSmith.Pulse.Web.csproj \
  --context PulseDbContext \
  --output-dir Data/Migrations
```

Generated SQL scripts are in `db/`.

## Configuration

`src/DocSmith.Pulse.Web/appsettings.json`:

- `ConnectionStrings:DefaultConnection`
- `Pulse:GeneratorMode` (`Template` or `OpenAI`)
- `Pulse:ForceKillSwitch`
- `Pulse:WatermarkExports`
- `Pulse:OpenAI:*`

Optional environment overrides:

```bash
export Pulse__GeneratorMode=OpenAI
export Pulse__OpenAI__ApiKey=YOUR_KEY
export Pulse__OpenAI__Model=gpt-4.1-mini
export Pulse__ForceKillSwitch=false
```

## Notes

- Audit log entries are immutable by design (update/delete blocked at DbContext level).
- Safety controls are enforced both in UI and server middleware.
- No LinkedIn automation code is implemented.
