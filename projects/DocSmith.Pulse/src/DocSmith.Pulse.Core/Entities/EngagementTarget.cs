namespace DocSmith.Pulse.Core.Entities;

public class EngagementTarget
{
    public int Id { get; set; }
    public string PostUrl { get; set; } = "";
    public string AuthorName { get; set; } = "";
    public string PostSummary { get; set; } = "";
    public string DraftCommentShort { get; set; } = "";
    public string DraftCommentMedium { get; set; } = "";
    public string Status { get; set; } = "Queued"; // Queued | Used | Skipped
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
