namespace DocSmith.LinkedInBot.Models;

public class ActivityLog
{
    public int Id { get; set; }

    public string ActivityType { get; set; } = "Post"; // Post | Comment
    public string Title { get; set; } = ""; // e.g., topic or URL
    public string Notes { get; set; } = "";

    public DateTime ActivityAtUtc { get; set; } = DateTime.UtcNow;

    // Optional metrics (manual entry)
    public int? Impressions { get; set; }
    public int? Reactions { get; set; }
    public int? Comments { get; set; }
    public int? Clicks { get; set; }
}
