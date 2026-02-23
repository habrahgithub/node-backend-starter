using DocSmith.Pulse.Core.Enums;

namespace DocSmith.Pulse.Core.Entities;

public class ContentDraft
{
    public int Id { get; set; }
    public int ContentIdeaId { get; set; }
    public ContentIdea? ContentIdea { get; set; }

    public int VariantNo { get; set; }
    public ChannelType Channel { get; set; } = ChannelType.LinkedIn;
    public string DraftText { get; set; } = "";
    public string Hashtags { get; set; } = "";
    public bool IsApproved { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAtUtc { get; set; }
}
