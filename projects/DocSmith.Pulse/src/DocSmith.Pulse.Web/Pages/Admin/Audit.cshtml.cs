using DocSmith.Pulse.Core.Abstractions;
using DocSmith.Pulse.Core.Entities;
using DocSmith.Pulse.Infrastructure.Data;
using DocSmith.Pulse.Web.Pages;
using Microsoft.EntityFrameworkCore;

namespace DocSmith.Pulse.Web.Pages.Admin;

public class AuditModel : PulsePageModelBase
{
    private readonly PulseDbContext _db;

    public AuditModel(PulseDbContext db, ISafetyService safetyService, IAuditLogService auditLogService)
        : base(safetyService, auditLogService)
    {
        _db = db;
    }

    public List<AuditLog> Logs { get; set; } = new();
    public List<string> ActionTypes { get; set; } = new();
    public string SelectedAction { get; set; } = string.Empty;

    public async Task OnGetAsync(string? action)
    {
        await LoadSafetyAsync();

        SelectedAction = action?.Trim() ?? string.Empty;

        ActionTypes = await _db.AuditLogs
            .Select(x => x.Action)
            .Distinct()
            .OrderBy(x => x)
            .ToListAsync();

        var query = _db.AuditLogs.AsQueryable();
        if (!string.IsNullOrWhiteSpace(SelectedAction))
        {
            query = query.Where(x => x.Action == SelectedAction);
        }

        Logs = await query
            .OrderByDescending(x => x.OccurredAtUtc)
            .Take(200)
            .ToListAsync();
    }
}
