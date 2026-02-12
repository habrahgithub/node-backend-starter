using DocSmith.Pulse.Core.Abstractions;
using DocSmith.Pulse.Core.Entities;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace DocSmith.Pulse.Web.Pages;

public abstract class PulsePageModelBase : PageModel
{
    protected readonly ISafetyService SafetyService;
    protected readonly IAuditLogService AuditLogService;

    protected PulsePageModelBase(ISafetyService safetyService, IAuditLogService auditLogService)
    {
        SafetyService = safetyService;
        AuditLogService = auditLogService;
    }

    public SafetyState SafetyState { get; private set; } = new();
    public bool IsPulseDisabled => SafetyService.IsKillSwitchEffective(SafetyState);

    protected async Task LoadSafetyAsync(CancellationToken cancellationToken = default)
    {
        SafetyState = await SafetyService.GetStateAsync(cancellationToken);
    }

    protected Task AuditAsync(
        string action,
        string entityType,
        string entityId,
        string inputSummary,
        bool wasBlocked = false,
        string reason = "",
        CancellationToken cancellationToken = default)
    {
        return AuditLogService.LogAsync(
            action,
            entityType,
            entityId,
            inputSummary,
            Request.Path,
            wasBlocked,
            reason,
            actor: "LocalUser",
            cancellationToken: cancellationToken);
    }
}
