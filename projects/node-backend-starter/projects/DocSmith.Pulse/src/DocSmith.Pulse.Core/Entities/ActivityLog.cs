using DocSmith.Pulse.Core.Enums;

namespace DocSmith.Pulse.Core.Entities;

public class ActivityLog
{
    public int Id { get; set; }

    public ActivityType ActivityType { get; set; } = ActivityType.Post;
    public string Title { get; set; } = "";
    public string Notes { get; set; } = "";

    public int? ContentIdeaId { get; set; }
    public int? EngagementTargetId { get; set; }

    public DateTime ActivityAtUtc { get; set; } = DateTime.UtcNow;

    public int? Impressions { get; set; }
    public int? Reactions { get; set; }
    public int? Comments { get; set; }
    public int? Clicks { get; set; }
}
