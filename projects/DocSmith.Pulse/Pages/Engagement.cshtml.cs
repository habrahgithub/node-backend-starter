using DocSmith.Pulse.Data;
using DocSmith.Pulse.Models;
using DocSmith.Pulse.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace DocSmith.Pulse.Pages;

public class EngagementModel : PageModel
{
    private readonly AppDbContext _db;
    private readonly IDraftGenerator _generator;

    public EngagementModel(AppDbContext db, IDraftGenerator generator)
    {
        _db = db;
        _generator = generator;
    }

    [BindProperty]
    public EngagementInput Input { get; set; } = new();

    public List<EngagementTarget> Targets { get; set; } = new();
    public EngagementTarget? GeneratedTarget { get; set; }

    public class EngagementInput
    {
        public string PostUrl { get; set; } = "";
        public string AuthorName { get; set; } = "";
        public string PostSummary { get; set; } = "";
    }

    public async Task OnGetAsync(int? generatedId)
    {
        Targets = await _db.EngagementTargets
            .OrderByDescending(t => t.Id)
            .Take(20)
            .ToListAsync();

        if (generatedId.HasValue)
        {
            GeneratedTarget = Targets.FirstOrDefault(t => t.Id == generatedId.Value)
                ?? await _db.EngagementTargets.FirstOrDefaultAsync(t => t.Id == generatedId.Value);
        }
    }

    public async Task<IActionResult> OnPostGenerateAsync()
    {
        if (string.IsNullOrWhiteSpace(Input.PostSummary))
        {
            return RedirectToPage();
        }

        var (shortComment, mediumComment) = await _generator.GenerateCommentsAsync(Input.PostSummary.Trim());

        var target = new EngagementTarget
        {
            PostUrl = Input.PostUrl?.Trim() ?? "",
            AuthorName = string.IsNullOrWhiteSpace(Input.AuthorName) ? "Unknown" : Input.AuthorName.Trim(),
            PostSummary = Input.PostSummary.Trim(),
            DraftCommentShort = shortComment,
            DraftCommentMedium = mediumComment,
            Status = "Queued"
        };

        _db.EngagementTargets.Add(target);
        await _db.SaveChangesAsync();

        return RedirectToPage(new { generatedId = target.Id });
    }
}
