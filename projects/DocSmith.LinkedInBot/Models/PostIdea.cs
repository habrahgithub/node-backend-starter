namespace DocSmith.LinkedInBot.Models;

public class PostIdea
{
    public int Id { get; set; }
    public string Topic { get; set; } = "";
    public string Persona { get; set; } = "SME Founder";
    public string PostType { get; set; } = "Tip"; // Tip | Checklist | Insight | Case
    public string KeyPoint { get; set; } = "";
    public string CtaStyle { get; set; } = "Soft"; // Soft | Neutral | None
    public string Status { get; set; } = "Idea"; // Idea | Drafted | Approved | Posted
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
