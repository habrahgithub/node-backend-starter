namespace DocSmith.Pulse.Web.Models;

public class SafetyBannerVm
{
    public bool IsKillSwitchEnabled { get; set; }
    public bool IsSafeModeEnabled { get; set; }
    public bool AiGenerationEnabled { get; set; }
    public bool SchedulerEnabled { get; set; }
    public bool ExportsEnabled { get; set; }
}
