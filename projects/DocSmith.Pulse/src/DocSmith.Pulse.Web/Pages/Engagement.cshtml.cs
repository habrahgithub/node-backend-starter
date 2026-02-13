using DocSmith.Pulse.Core.Abstractions;
using DocSmith.Pulse.Core.Entities;
using DocSmith.Pulse.Infrastructure.Data;
using DocSmith.Pulse.Web.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DocSmith.Pulse.Web.Pages;

[RequiresPulseEnabled]
public class EngagementModel : PulsePageModelBase
{
    private readonly PulseDbContext _db;
    private readonly IDraftGenerator _generator;

    public EngagementModel(PulseDbContext db, ISafetyService safetyService, IAuditLogService auditLogService, IDraftGenerator generator)
        : base(safetyService, auditLogService)
    {
        _db = db;
        _generator = generator;
    }

    [BindProperty]
    public InputModel Input { get; set; } = new();

    public List<EngagementTarget> Targets { get; set; } = new();
    public EngagementTarget? Generated { get; set; }

    public class InputModel
    {
        public string PostUrl { get; set; } = "";
        public string AuthorName { get; set; } = "";
        public string PostSummary { get; set; } = "";
    }

    public async Task OnGetAsync(int? generatedId)
    {
        await LoadSafetyAsync();
        await LoadTargetsAsync();

        if (generatedId.HasValue)
        {
            Generated = Targets.FirstOrDefault(x => x.Id == generatedId.Value)
                ?? await _db.EngagementTargets.FirstOrDefaultAsync(x => x.Id == generatedId.Value);
        }
    }

    public async Task<IActionResult> OnPostGenerateAsync()
    {
        if (string.IsNullOrWhiteSpace(Input.PostSummary))
        {
            return RedirectToPage();
        }

        var voice = await _db.BrandVoices
            .OrderByDescending(v => v.IsDefault)
            .ThenBy(v => v.Id)
            .FirstOrDefaultAsync() ?? new BrandVoice();

        var generated = await _generator.GenerateCommentsAsync(Input.PostSummary.Trim(), voice);

        var target = new EngagementTarget
        {
            PostUrl = Input.PostUrl?.Trim() ?? "",
            AuthorName = string.IsNullOrWhiteSpace(Input.AuthorName) ? "Unknown" : Input.AuthorName.Trim(),
            PostSummary = Input.PostSummary.Trim(),
            DraftCommentShort = generated.ShortComment,
            DraftCommentMedium = generated.MediumComment,
            Status = "Queued"
        };

        _db.EngagementTargets.Add(target);
        await _db.SaveChangesAsync();

        await AuditAsync("EngagementGenerated", nameof(EngagementTarget), target.Id.ToString(), $"Author={target.AuthorName}");

        return RedirectToPage(new { generatedId = target.Id });
    }

    private async Task LoadTargetsAsync()
    {
        Targets = await _db.EngagementTargets
            .OrderByDescending(x => x.Id)
            .Take(30)
            .ToListAsync();
    }
}
