using DocSmith.Pulse.Core.Abstractions;
using DocSmith.Pulse.Core.Entities;
using DocSmith.Pulse.Web.Pages;
using Microsoft.AspNetCore.Mvc;

namespace DocSmith.Pulse.Web.Pages.Admin;

public class SafetyModel : PulsePageModelBase
{
    public SafetyModel(ISafetyService safetyService, IAuditLogService auditLogService)
        : base(safetyService, auditLogService)
    {
    }

    [BindProperty]
    public SafetyInput Input { get; set; } = new();

    public SafetyState State { get; set; } = new();

    public class SafetyInput
    {
        public bool GlobalKillSwitchEnabled { get; set; }
        public bool OrganizationSafeModeEnabled { get; set; } = true;
        public bool AiGenerationEnabled { get; set; }
        public bool SchedulerEnabled { get; set; }
        public bool ExportsEnabled { get; set; } = true;
    }

    public async Task OnGetAsync()
    {
        await LoadSafetyAsync();
        State = SafetyState;
        Input = new SafetyInput
        {
            GlobalKillSwitchEnabled = State.GlobalKillSwitchEnabled,
            OrganizationSafeModeEnabled = State.OrganizationSafeModeEnabled,
            AiGenerationEnabled = State.AiGenerationEnabled,
            SchedulerEnabled = State.SchedulerEnabled,
            ExportsEnabled = State.ExportsEnabled
        };
    }

    public async Task<IActionResult> OnPostSaveAsync()
    {
        State = await SafetyService.UpdateAsync(
            Input.GlobalKillSwitchEnabled,
            Input.OrganizationSafeModeEnabled,
            Input.AiGenerationEnabled,
            Input.SchedulerEnabled,
            Input.ExportsEnabled);

        await AuditAsync(
            "SafetyStateUpdated",
            nameof(SafetyState),
            SafetyState.SingletonId.ToString(),
            $"Kill={State.GlobalKillSwitchEnabled}; Safe={State.OrganizationSafeModeEnabled}; AI={State.AiGenerationEnabled}; Scheduler={State.SchedulerEnabled}; Exports={State.ExportsEnabled}");

        return RedirectToPage();
    }
}
