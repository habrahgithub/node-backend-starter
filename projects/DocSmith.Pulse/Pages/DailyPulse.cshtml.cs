using DocSmith.Pulse.Data;
using DocSmith.Pulse.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace DocSmith.Pulse.Pages;

public class DailyPulseModel : PageModel
{
    private readonly AppDbContext _db;

    public DailyPulseModel(AppDbContext db)
    {
        _db = db;
    }

    public PostDraft? TodaysPost { get; set; }
    public List<EngagementTarget> TodaysComments { get; set; } = new();

    public async Task OnGetAsync()
    {
        TodaysPost = await _db.PostDrafts
            .Include(d => d.PostIdea)
            .Where(d => d.IsApproved && d.PostIdea != null && d.PostIdea.Status == "Approved")
            .OrderBy(d => d.ApprovedAtUtc ?? d.CreatedAtUtc)
            .FirstOrDefaultAsync();

        TodaysComments = await _db.EngagementTargets
            .Where(t => t.Status == "Queued")
            .OrderBy(t => t.CreatedAtUtc)
            .Take(5)
            .ToListAsync();
    }

    public async Task<IActionResult> OnPostMarkPostedAsync(int draftId)
    {
        var draft = await _db.PostDrafts
            .Include(d => d.PostIdea)
            .FirstOrDefaultAsync(d => d.Id == draftId);

        if (draft == null || draft.PostIdea == null)
        {
            return RedirectToPage();
        }

        if (draft.PostIdea.Status == "Posted")
        {
            return RedirectToPage();
        }

        draft.PostIdea.Status = "Posted";

        _db.ActivityLogs.Add(new ActivityLog
        {
            ActivityType = "Post",
            Title = draft.PostIdea.Topic,
            Notes = $"Posted approved draft variant {draft.VariantNo}",
            ActivityAtUtc = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostMarkCommentUsedAsync(int targetId)
    {
        var target = await _db.EngagementTargets.FirstOrDefaultAsync(t => t.Id == targetId);
        if (target == null)
        {
            return RedirectToPage();
        }

        if (target.Status == "Used")
        {
            return RedirectToPage();
        }

        target.Status = "Used";

        _db.ActivityLogs.Add(new ActivityLog
        {
            ActivityType = "Comment",
            Title = string.IsNullOrWhiteSpace(target.PostUrl) ? target.AuthorName : target.PostUrl,
            Notes = $"Comment used for post by {target.AuthorName}",
            ActivityAtUtc = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        return RedirectToPage();
    }
}
