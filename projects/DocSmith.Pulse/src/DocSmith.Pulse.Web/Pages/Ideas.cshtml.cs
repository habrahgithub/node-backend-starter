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
public class IdeasModel : PulsePageModelBase
{
    private readonly PulseDbContext _db;
    private readonly IDraftGenerator _generator;

    public IdeasModel(PulseDbContext db, ISafetyService safetyService, IAuditLogService auditLogService, IDraftGenerator generator)
        : base(safetyService, auditLogService)
    {
        _db = db;
        _generator = generator;
    }

    [BindProperty]
    public IdeaInput Input { get; set; } = new();

    public List<ContentIdea> Ideas { get; set; } = new();
    public List<Campaign> Campaigns { get; set; } = new();

    public class IdeaInput
    {
        public string Topic { get; set; } = "";
        public string Persona { get; set; } = "SME Founder";
        public ContentType ContentType { get; set; } = ContentType.Tip;
        public string KeyPoint { get; set; } = "";
        public CtaStyle CtaStyle { get; set; } = CtaStyle.None;
        public int? CampaignId { get; set; }
    }

    public async Task OnGetAsync()
    {
        await LoadSafetyAsync();
        await LoadDataAsync();
    }

    public async Task<IActionResult> OnPostAddAsync()
    {
        if (string.IsNullOrWhiteSpace(Input.Topic))
        {
            return RedirectToPage();
        }

        var idea = new ContentIdea
        {
            Topic = Input.Topic.Trim(),
            Persona = string.IsNullOrWhiteSpace(Input.Persona) ? "SME Founder" : Input.Persona.Trim(),
            ContentType = Input.ContentType,
            KeyPoint = Input.KeyPoint?.Trim() ?? "",
            CtaStyle = Input.CtaStyle,
            CampaignId = Input.CampaignId,
            Status = ContentIdeaStatus.Idea
        };

        _db.ContentIdeas.Add(idea);
        await _db.SaveChangesAsync();

        await AuditAsync("IdeaAdded", nameof(ContentIdea), idea.Id.ToString(), $"Topic={idea.Topic}; CampaignId={idea.CampaignId}");

        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostGenerateAsync(int id)
    {
        var idea = await _db.ContentIdeas.FirstOrDefaultAsync(x => x.Id == id);
        if (idea == null)
        {
            return RedirectToPage();
        }

        if (!ContentWorkflow.CanTransition(idea.Status, ContentIdeaStatus.Drafted))
        {
            await AuditAsync(
                "DraftGenerationRejected",
                nameof(ContentIdea),
                id.ToString(),
                $"Status={idea.Status}",
                wasBlocked: true,
                reason: "InvalidStateTransition");
            return RedirectToPage();
        }

        var voice = await _db.BrandVoices
            .OrderByDescending(x => x.IsDefault)
            .ThenBy(x => x.Id)
            .FirstOrDefaultAsync() ?? new BrandVoice();

        var existing = await _db.ContentDrafts.Where(d => d.ContentIdeaId == id).ToListAsync();
        if (existing.Count > 0)
        {
            _db.ContentDrafts.RemoveRange(existing);
        }

        for (var variant = 1; variant <= 3; variant++)
        {
            var generated = await _generator.GeneratePostAsync(idea, voice, variant, ChannelType.LinkedIn);
            _db.ContentDrafts.Add(new ContentDraft
            {
                ContentIdeaId = idea.Id,
                VariantNo = variant,
                Channel = ChannelType.LinkedIn,
                DraftText = generated.DraftText,
                Hashtags = generated.Hashtags
            });
        }

        idea.Status = ContentIdeaStatus.Drafted;
        await _db.SaveChangesAsync();

        await AuditAsync("DraftsGenerated", nameof(ContentIdea), idea.Id.ToString(), "Variants=3; Channel=LinkedIn");

        return RedirectToPage("/Drafts", new { id = idea.Id });
    }

    private async Task LoadDataAsync()
    {
        Ideas = await _db.ContentIdeas
            .Include(x => x.Campaign)
            .OrderByDescending(x => x.Id)
            .Take(50)
            .ToListAsync();

        Campaigns = await _db.Campaigns
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync();
    }
}
