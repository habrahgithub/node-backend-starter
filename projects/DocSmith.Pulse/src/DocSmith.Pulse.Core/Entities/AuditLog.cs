namespace DocSmith.Pulse.Core.Entities;

public class AuditLog
{
    public int Id { get; set; }
    public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;

    public string Actor { get; set; } = "LocalUser";
    public string Action { get; set; } = "";
    public string EntityType { get; set; } = "";
    public string EntityId { get; set; } = "";
    public string InputSummary { get; set; } = "";
    public string SourcePath { get; set; } = "";

    public bool WasBlocked { get; set; }
    public string Reason { get; set; } = "";
}
