using DocSmith.Pulse.Core.Abstractions;
using DocSmith.Pulse.Core.Entities;
using DocSmith.Pulse.Core.Enums;
using DocSmith.Pulse.Infrastructure.Data;
using DocSmith.Pulse.Web.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DocSmith.Pulse.Web.Pages;

[RequiresPulseEnabled]
public class CampaignsModel : PulsePageModelBase
{
    private readonly PulseDbContext _db;
    private readonly IDraftGenerator _generator;

    private static readonly ContentType[] PackContentTypes =
    {
        ContentType.Tip,
        ContentType.Checklist,
        ContentType.MythVsFact,
        ContentType.MicroCase,
        ContentType.FieldNote,
        ContentType.Insight,
        ContentType.Checklist
    };

    public CampaignsModel(PulseDbContext db, ISafetyService safetyService, IAuditLogService auditLogService, IDraftGenerator generator)
        : base(safetyService, auditLogService)
    {
        _db = db;
        _generator = generator;
    }

    [BindProperty]
    public CampaignInput NewCampaign { get; set; } = new();

    public List<Campaign> Campaigns { get; set; } = new();

    public class CampaignInput
    {
        public string Name { get; set; } = "";
        public string Objective { get; set; } = "";
        public DateTime? StartsOnUtc { get; set; }
        public DateTime? EndsOnUtc { get; set; }
    }

    public async Task OnGetAsync()
    {
        await LoadSafetyAsync();
        await LoadCampaignsAsync();
    }

    public async Task<IActionResult> OnPostAddAsync()
    {
        if (string.IsNullOrWhiteSpace(NewCampaign.Name))
        {
            return RedirectToPage();
        }

        var campaign = new Campaign
        {
            Name = NewCampaign.Name.Trim(),
            Objective = NewCampaign.Objective?.Trim() ?? "",
            StartsOnUtc = NewCampaign.StartsOnUtc,
            EndsOnUtc = NewCampaign.EndsOnUtc
        };

        _db.Campaigns.Add(campaign);
        await _db.SaveChangesAsync();
        await AuditAsync("CampaignCreated", nameof(Campaign), campaign.Id.ToString(), $"Name={campaign.Name}");

        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostGeneratePackAsync(int campaignId, string persona, DateTime startDateUtc)
    {
        var campaign = await _db.Campaigns.FirstOrDefaultAsync(x => x.Id == campaignId);
        if (campaign == null)
        {
            return RedirectToPage();
        }

        var voice = await _db.BrandVoices
            .OrderByDescending(v => v.IsDefault)
            .ThenBy(v => v.Id)
            .FirstOrDefaultAsync() ?? new BrandVoice();

        for (var i = 0; i < 7; i++)
        {
            var scheduledDay = DateTime.SpecifyKind(startDateUtc.Date.AddDays(i), DateTimeKind.Utc).AddHours(7);

            var idea = new ContentIdea
            {
                CampaignId = campaign.Id,
                Persona = string.IsNullOrWhiteSpace(persona) ? "SME Founder" : persona,
                Topic = $"{campaign.Name} - Day {i + 1}",
                ContentType = PackContentTypes[i],
                CtaStyle = CtaStyle.Soft,
                KeyPoint = "Practical compliance step for UAE payroll operators.",
                Status = ContentIdeaStatus.Scheduled,
                ScheduledForUtc = scheduledDay
            };

            _db.ContentIdeas.Add(idea);
            await _db.SaveChangesAsync();

            var generated = await _generator.GeneratePostAsync(idea, voice, 1, ChannelType.LinkedIn);

            _db.ContentDrafts.Add(new ContentDraft
            {
                ContentIdeaId = idea.Id,
                VariantNo = 1,
                Channel = ChannelType.LinkedIn,
                DraftText = generated.DraftText,
                Hashtags = generated.Hashtags,
                IsApproved = true,
                ApprovedAtUtc = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
        }

        await AuditAsync("CampaignPackGenerated", nameof(Campaign), campaign.Id.ToString(), "Days=7; Channel=LinkedIn");

        return RedirectToPage();
    }

    private async Task LoadCampaignsAsync()
    {
        Campaigns = await _db.Campaigns
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(100)
            .ToListAsync();
    }
}
