namespace DocSmith.Pulse.Core.Entities;

public class SafetyState
{
    public const int SingletonId = 1;

    public int Id { get; set; } = SingletonId;
    public bool GlobalKillSwitchEnabled { get; set; }
    public bool OrganizationSafeModeEnabled { get; set; } = true;
    public bool AiGenerationEnabled { get; set; }
    public bool SchedulerEnabled { get; set; }
    public bool ExportsEnabled { get; set; } = true;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
