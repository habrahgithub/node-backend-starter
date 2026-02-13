# Evidence

## Acceptance Criteria Mapping

### Phase 1 (PULSE-S1)

- [x] App runs locally with SQLite
  - Evidence:
    - `./.dotnet/dotnet build DocSmith.Pulse.sln` succeeds
    - `./.dotnet/dotnet run --project src/DocSmith.Pulse.Web/DocSmith.Pulse.Web.csproj` starts successfully

- [x] Kill Switch disables protected mutating actions (UI + server)
  - Evidence:
    - Middleware block returns redirect to `?blocked=killswitch` for protected handlers
    - Captured blocked POST:
      - `POST /Ideas?handler=Generate&id=999` returned `302` with `Location: /Ideas?blocked=killswitch`

- [x] Safe Mode defaults ON
  - Evidence:
    - Seeded `SafetyState` with `OrganizationSafeModeEnabled=true`

- [x] Audit log records key actions + block events
  - Evidence actions implemented:
    - `IdeaAdded`
    - `DraftsGenerated`
    - `DraftApproved`
    - `EngagementGenerated`
    - `PostMarked`
    - `CommentMarkedUsed`
    - `SafetyStateUpdated`
    - `PulseActionBlocked`

- [x] No LinkedIn automation code exists
  - Evidence:
    - No Selenium/Playwright social-action automation paths in app logic

### Phase 2 (PULSE-S2)

- [x] Brand voice profiles and guardrails stored
  - Evidence:
    - `BrandVoice` entity + seeded default profile

- [x] State machine and transition guards enforced server-side
  - Evidence:
    - `ContentWorkflow` checks used before approve/schedule/post transitions

- [x] Calendar scheduling works
  - Evidence:
    - `/Calendar` scheduling handler + weekly grid

## Screenshot Evidence

- `evidence/screenshots/safety-killswitch-on.png`
- `evidence/screenshots/ideas-blocked.png`
- `evidence/screenshots/audit-block-event.png`

## Migration Evidence

- EF migration:
  - `src/DocSmith.Pulse.Infrastructure/Data/Migrations/20260212212653_InitialPrototype.cs`
- SQL script:
  - `db/001_initialprototype.sql`
