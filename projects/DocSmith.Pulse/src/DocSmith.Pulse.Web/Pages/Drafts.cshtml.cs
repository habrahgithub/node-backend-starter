using System.Text;
using DocSmith.Pulse.Core.Abstractions;
using DocSmith.Pulse.Core.Configuration;
using DocSmith.Pulse.Core.Entities;
using DocSmith.Pulse.Core.Enums;
using DocSmith.Pulse.Core.Workflow;
using DocSmith.Pulse.Infrastructure.Data;
using DocSmith.Pulse.Web.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace DocSmith.Pulse.Web.Pages;

[RequiresPulseEnabled]
public class DraftsModel : PulsePageModelBase
{
    private readonly PulseDbContext _db;
    private readonly IOptions<PulseOptions> _pulseOptions;

    public DraftsModel(
        PulseDbContext db,
        ISafetyService safetyService,
        IAuditLogService auditLogService,
        IOptions<PulseOptions> pulseOptions)
        : base(safetyService, auditLogService)
    {
        _db = db;
        _pulseOptions = pulseOptions;
    }

    public ContentIdea? Idea { get; set; }
    public List<ContentDraft> Drafts { get; set; } = new();
    public List<ContentIdea> IdeaOptions { get; set; } = new();

    public async Task OnGetAsync(int? id)
    {
        await LoadSafetyAsync();
        await LoadIdeaOptionsAsync();

        if (id.HasValue)
        {
            await LoadIdeaAsync(id.Value);
        }
    }

    public async Task<IActionResult> OnPostApproveAsync(int draftId)
    {
        var draft = await _db.ContentDrafts
            .Include(x => x.ContentIdea)
            .FirstOrDefaultAsync(x => x.Id == draftId);

        if (draft?.ContentIdea == null)
        {
            return RedirectToPage();
        }

        var idea = draft.ContentIdea;
        if (!ContentWorkflow.CanTransition(idea.Status, ContentIdeaStatus.Approved))
        {
            await AuditAsync(
                "DraftApprovalRejected",
                nameof(ContentIdea),
                idea.Id.ToString(),
                $"Status={idea.Status}",
                wasBlocked: true,
                reason: "InvalidStateTransition");

            return RedirectToPage(new { id = idea.Id });
        }

        var siblings = await _db.ContentDrafts.Where(x => x.ContentIdeaId == draft.ContentIdeaId).ToListAsync();
        foreach (var sibling in siblings)
        {
            sibling.IsApproved = false;
            sibling.ApprovedAtUtc = null;
        }

        draft.IsApproved = true;
        draft.ApprovedAtUtc = DateTime.UtcNow;
        idea.Status = ContentIdeaStatus.Approved;

        await _db.SaveChangesAsync();
        await AuditAsync("DraftApproved", nameof(ContentDraft), draft.Id.ToString(), $"IdeaId={idea.Id}; Variant={draft.VariantNo}");

        return RedirectToPage(new { id = idea.Id });
    }

    public async Task<IActionResult> OnPostScheduleAsync(int ideaId, DateTime scheduledForUtc)
    {
        var idea = await _db.ContentIdeas.FirstOrDefaultAsync(x => x.Id == ideaId);
        if (idea == null)
        {
            return RedirectToPage();
        }

        if (!ContentWorkflow.CanSchedule(idea.Status, scheduledForUtc))
        {
            await AuditAsync(
                "ScheduleRejected",
                nameof(ContentIdea),
                idea.Id.ToString(),
                $"Status={idea.Status}; ScheduledFor={scheduledForUtc:o}",
                wasBlocked: true,
                reason: "InvalidStateTransitionOrDate");
            return RedirectToPage(new { id = idea.Id });
        }

        idea.ScheduledForUtc = DateTime.SpecifyKind(scheduledForUtc, DateTimeKind.Utc);
        idea.Status = ContentIdeaStatus.Scheduled;

        await _db.SaveChangesAsync();
        await AuditAsync("IdeaScheduled", nameof(ContentIdea), idea.Id.ToString(), $"ScheduledFor={idea.ScheduledForUtc:o}");

        return RedirectToPage(new { id = idea.Id });
    }

    public async Task<IActionResult> OnPostExportAsync(int draftId)
    {
        var draft = await _db.ContentDrafts
            .Include(x => x.ContentIdea)
            .FirstOrDefaultAsync(x => x.Id == draftId);

        if (draft == null)
        {
            return RedirectToPage();
        }

        var sb = new StringBuilder();
        sb.AppendLine(draft.DraftText);
        sb.AppendLine();
        sb.AppendLine(draft.Hashtags);

        if (_pulseOptions.Value.WatermarkExports)
        {
            sb.AppendLine();
            sb.AppendLine($"[{_pulseOptions.Value.WatermarkText}]");
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        await AuditAsync("DraftExported", nameof(ContentDraft), draft.Id.ToString(), $"IdeaId={draft.ContentIdeaId}");

        return File(bytes, "text/markdown", $"docsmith-pulse-draft-{draft.Id}.md");
    }

    private async Task LoadIdeaOptionsAsync()
    {
        IdeaOptions = await _db.ContentIdeas
            .OrderByDescending(x => x.Id)
            .Take(100)
            .ToListAsync();
    }

    private async Task LoadIdeaAsync(int id)
    {
        Idea = await _db.ContentIdeas.FirstOrDefaultAsync(x => x.Id == id);
        if (Idea == null)
        {
            return;
        }

        Drafts = await _db.ContentDrafts
            .Where(x => x.ContentIdeaId == id)
            .OrderBy(x => x.VariantNo)
            .ToListAsync();
    }
}
