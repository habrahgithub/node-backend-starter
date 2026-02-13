using DocSmith.Pulse.Core.Abstractions;
using DocSmith.Pulse.Core.Entities;
using DocSmith.Pulse.Core.Enums;
using DocSmith.Pulse.Core.Workflow;
using DocSmith.Pulse.Infrastructure.Data;
using DocSmith.Pulse.Web.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DocSmith.Pulse.Web.Pages;

[RequiresPulseEnabled]
public class CalendarModel : PulsePageModelBase
{
    private readonly PulseDbContext _db;

    public CalendarModel(PulseDbContext db, ISafetyService safetyService, IAuditLogService auditLogService)
        : base(safetyService, auditLogService)
    {
        _db = db;
    }

    public DateTime WeekStartUtc { get; set; }
    public DateTime WeekEndUtc { get; set; }
    public List<DateTime> Days { get; set; } = new();
    public Dictionary<DateTime, List<ContentIdea>> ScheduledByDay { get; set; } = new();
    public List<ContentIdea> ApprovedIdeas { get; set; } = new();

    public async Task OnGetAsync(DateTime? weekStartUtc)
    {
        await LoadSafetyAsync();

        WeekStartUtc = NormalizeWeekStart(weekStartUtc ?? DateTime.UtcNow.Date);
        WeekEndUtc = WeekStartUtc.AddDays(6);
        Days = Enumerable.Range(0, 7).Select(i => WeekStartUtc.AddDays(i)).ToList();

        var scheduled = await _db.ContentIdeas
            .Where(x => x.Status == ContentIdeaStatus.Scheduled &&
                        x.ScheduledForUtc != null &&
                        x.ScheduledForUtc >= WeekStartUtc &&
                        x.ScheduledForUtc < WeekStartUtc.AddDays(7))
            .OrderBy(x => x.ScheduledForUtc)
            .ToListAsync();

        ScheduledByDay = scheduled
            .GroupBy(x => x.ScheduledForUtc!.Value.Date)
            .ToDictionary(g => g.Key, g => g.ToList());

        ApprovedIdeas = await _db.ContentIdeas
            .Where(x => x.Status == ContentIdeaStatus.Approved)
            .OrderBy(x => x.Id)
            .Take(100)
            .ToListAsync();
    }

    public async Task<IActionResult> OnPostScheduleAsync(int ideaId, DateTime scheduledForUtc)
    {
        var idea = await _db.ContentIdeas.FirstOrDefaultAsync(x => x.Id == ideaId);
        if (idea == null)
        {
            return RedirectToPage();
        }

        var utc = DateTime.SpecifyKind(scheduledForUtc, DateTimeKind.Utc);
        if (!ContentWorkflow.CanSchedule(idea.Status, utc))
        {
            await AuditAsync(
                "CalendarScheduleRejected",
                nameof(ContentIdea),
                idea.Id.ToString(),
                $"Status={idea.Status}; ScheduledFor={utc:o}",
                wasBlocked: true,
                reason: "InvalidStateTransitionOrDate");
            return RedirectToPage();
        }

        idea.Status = ContentIdeaStatus.Scheduled;
        idea.ScheduledForUtc = utc;

        await _db.SaveChangesAsync();
        await AuditAsync("CalendarScheduled", nameof(ContentIdea), idea.Id.ToString(), $"ScheduledFor={utc:o}");

        return RedirectToPage(new { weekStartUtc = NormalizeWeekStart(utc).ToString("yyyy-MM-dd") });
    }

    private static DateTime NormalizeWeekStart(DateTime date)
    {
        var d = date.Date;
        while (d.DayOfWeek != DayOfWeek.Monday)
        {
            d = d.AddDays(-1);
        }

        return DateTime.SpecifyKind(d, DateTimeKind.Utc);
    }
}
