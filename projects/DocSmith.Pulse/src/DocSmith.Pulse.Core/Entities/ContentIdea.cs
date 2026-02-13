using DocSmith.Pulse.Core.Enums;

namespace DocSmith.Pulse.Core.Entities;

public class ContentIdea
{
    public int Id { get; set; }
    public string Topic { get; set; } = "";
    public string Persona { get; set; } = "SME Founder";
    public ContentType ContentType { get; set; } = ContentType.Tip;
    public string KeyPoint { get; set; } = "";
    public CtaStyle CtaStyle { get; set; } = CtaStyle.None;
    public ContentIdeaStatus Status { get; set; } = ContentIdeaStatus.Idea;

    public int? CampaignId { get; set; }
    public Campaign? Campaign { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ScheduledForUtc { get; set; }
}
