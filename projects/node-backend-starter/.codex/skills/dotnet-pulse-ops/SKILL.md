---
name: dotnet-pulse-ops
description: Build, run, and maintain the DocSmith Pulse .NET 8 solution, including EF Core migrations and safety-control validation. Use when working in projects/DocSmith.Pulse for feature work, debugging, or release preparation.
---

# Dotnet Pulse Ops

## Scope

Operate `projects/DocSmith.Pulse`.

## Workflow

1. Use the repo SDK wrapper when available: `./.dotnet/dotnet`.
2. Run web app:
   - `./.dotnet/dotnet run --project src/DocSmith.Pulse.Web/DocSmith.Pulse.Web.csproj`
3. Apply database migrations:
   - `./.dotnet/dotnet dotnet-ef database update --project src/DocSmith.Pulse.Infrastructure/DocSmith.Pulse.Infrastructure.csproj --startup-project src/DocSmith.Pulse.Web/DocSmith.Pulse.Web.csproj --context PulseDbContext`
4. Create migrations:
   - `./.dotnet/dotnet dotnet-ef migrations add <Name> --project src/DocSmith.Pulse.Infrastructure/DocSmith.Pulse.Infrastructure.csproj --startup-project src/DocSmith.Pulse.Web/DocSmith.Pulse.Web.csproj --context PulseDbContext --output-dir Data/Migrations`

## Safety Checks

1. Verify kill-switch and safe-mode behavior before release.
2. Verify audit log append-only protections after data-layer changes.
3. Preserve manual publishing model and no-platform-automation constraints.

## Guardrails

- Keep solution boundaries: Core, Infrastructure, Web.
- Keep configuration keys aligned with `appsettings.json` and env override format.
- Preserve safety middleware behavior on mutating handlers.
