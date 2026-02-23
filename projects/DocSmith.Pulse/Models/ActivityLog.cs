namespace DocSmith.Pulse.Models;

public class ActivityLog
{
    public int Id { get; set; }

    public string ActivityType { get; set; } = "Post"; // Post | Comment
    public string Title { get; set; } = ""; // topic or URL
    public string Notes { get; set; } = "";

    public DateTime ActivityAtUtc { get; set; } = DateTime.UtcNow;

    public int? Impressions { get; set; }
    public int? Reactions { get; set; }
    public int? Comments { get; set; }
    public int? Clicks { get; set; }
}
