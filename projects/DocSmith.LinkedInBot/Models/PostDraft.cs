namespace DocSmith.LinkedInBot.Models;

public class PostDraft
{
    public int Id { get; set; }
    public int PostIdeaId { get; set; }
    public PostIdea? PostIdea { get; set; }

    public int VariantNo { get; set; } // 1..3
    public string DraftText { get; set; } = "";
    public string Hashtags { get; set; } = "";
    public bool IsApproved { get; set; } = false;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAtUtc { get; set; }
}
