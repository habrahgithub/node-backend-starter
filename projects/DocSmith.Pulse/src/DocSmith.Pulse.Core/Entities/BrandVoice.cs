namespace DocSmith.Pulse.Core.Entities;

public class BrandVoice
{
    public int Id { get; set; }
    public string Name { get; set; } = "DocSmith Professional";
    public string Persona { get; set; } = "SME Founder";
    public string ToneRules { get; set; } = "Authoritative, compliance-aware, practical, concise.";
    public string ForbiddenClaimsCsv { get; set; } = "guaranteed,official,MoHRE approved";
    public bool AvoidFearMarketing { get; set; } = true;
    public bool AvoidEmojis { get; set; } = true;
    public bool IsDefault { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
