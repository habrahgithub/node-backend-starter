using DocSmith.Pulse.Core.Abstractions;
using DocSmith.Pulse.Core.Entities;
using DocSmith.Pulse.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DocSmith.Pulse.Web.Pages;

public class LogsModel : PulsePageModelBase
{
    private readonly PulseDbContext _db;

    public LogsModel(PulseDbContext db, ISafetyService safetyService, IAuditLogService auditLogService)
        : base(safetyService, auditLogService)
    {
        _db = db;
    }

    public List<ActivityLog> Logs { get; set; } = new();

    public async Task OnGetAsync()
    {
        await LoadSafetyAsync();
        Logs = await _db.ActivityLogs
            .OrderByDescending(x => x.ActivityAtUtc)
            .Take(200)
            .ToListAsync();
    }

    public async Task<IActionResult> OnPostUpdateMetricsAsync(int id, int? impressions, int? reactions, int? comments, int? clicks)
    {
        var log = await _db.ActivityLogs.FirstOrDefaultAsync(x => x.Id == id);
        if (log == null)
        {
            return RedirectToPage();
        }

        log.Impressions = impressions;
        log.Reactions = reactions;
        log.Comments = comments;
        log.Clicks = clicks;

        await _db.SaveChangesAsync();
        await AuditAsync("ActivityMetricsUpdated", nameof(ActivityLog), id.ToString(), "MetricsEdited=true");

        return RedirectToPage();
    }
}
