namespace DocSmith.Pulse.Core.Entities;

public class UserProfile
{
    public int Id { get; set; }
    public string DisplayName { get; set; } = "Local User";
    public string Email { get; set; } = "";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
