namespace DocSmith.Pulse.Core.Entities;

public class Campaign
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Objective { get; set; } = "";
    public DateTime? StartsOnUtc { get; set; }
    public DateTime? EndsOnUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
