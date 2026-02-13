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
public class DailyPulseModel : PulsePageModelBase
{
    private readonly PulseDbContext _db;

    public DailyPulseModel(PulseDbContext db, ISafetyService safetyService, IAuditLogService auditLogService)
        : base(safetyService, auditLogService)
    {
        _db = db;
    }

    public ContentDraft? TodaysPost { get; set; }
    public List<EngagementTarget> TodaysComments { get; set; } = new();

    public async Task OnGetAsync()
    {
        await LoadSafetyAsync();

        var todayStart = DateTime.UtcNow.Date;
        var todayEnd = todayStart.AddDays(1);

        TodaysPost = await _db.ContentDrafts
            .Include(d => d.ContentIdea)
            .Where(d => d.IsApproved &&
                        d.ContentIdea != null &&
                        d.ContentIdea.Status == ContentIdeaStatus.Scheduled &&
                        d.ContentIdea.ScheduledForUtc != null &&
                        d.ContentIdea.ScheduledForUtc >= todayStart &&
                        d.ContentIdea.ScheduledForUtc < todayEnd)
            .OrderBy(d => d.ContentIdea!.ScheduledForUtc)
            .FirstOrDefaultAsync();

        TodaysComments = await _db.EngagementTargets
            .Where(x => x.Status == "Queued")
            .OrderBy(x => x.CreatedAtUtc)
            .Take(5)
            .ToListAsync();
    }

    public async Task<IActionResult> OnPostMarkPostedAsync(int draftId)
    {
        var draft = await _db.ContentDrafts
            .Include(d => d.ContentIdea)
            .FirstOrDefaultAsync(d => d.Id == draftId);

        if (draft?.ContentIdea == null)
        {
            return RedirectToPage();
        }

        var idea = draft.ContentIdea;
        if (!ContentWorkflow.CanTransition(idea.Status, ContentIdeaStatus.Posted))
        {
            await AuditAsync(
                "PostMarkRejected",
                nameof(ContentIdea),
                idea.Id.ToString(),
                $"Status={idea.Status}",
                wasBlocked: true,
                reason: "InvalidStateTransition");
            return RedirectToPage();
        }

        _db.ActivityLogs.Add(new ActivityLog
        {
            ActivityType = ActivityType.Post,
            Title = idea.Topic,
            Notes = $"Posted scheduled draft variant {draft.VariantNo}",
            ContentIdeaId = idea.Id,
            ActivityAtUtc = DateTime.UtcNow
        });

        idea.Status = ContentIdeaStatus.Posted;

        await _db.SaveChangesAsync();
        await AuditAsync("PostMarked", nameof(ContentIdea), idea.Id.ToString(), $"DraftId={draft.Id}");

        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostMarkCommentUsedAsync(int targetId)
    {
        var target = await _db.EngagementTargets.FirstOrDefaultAsync(x => x.Id == targetId);
        if (target == null)
        {
            return RedirectToPage();
        }

        target.Status = "Used";

        _db.ActivityLogs.Add(new ActivityLog
        {
            ActivityType = ActivityType.Comment,
            Title = string.IsNullOrWhiteSpace(target.PostUrl) ? target.AuthorName : target.PostUrl,
            Notes = $"Comment used for {target.AuthorName}",
            EngagementTargetId = target.Id,
            ActivityAtUtc = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        await AuditAsync("CommentMarkedUsed", nameof(EngagementTarget), target.Id.ToString(), $"Author={target.AuthorName}");

        return RedirectToPage();
    }
}
