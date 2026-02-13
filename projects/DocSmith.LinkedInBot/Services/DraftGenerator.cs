using DocSmith.LinkedInBot.Models;

namespace DocSmith.LinkedInBot.Services;

public interface IDraftGenerator
{
    Task<(string draft, string hashtags)> GeneratePostAsync(PostIdea idea, int variantNo);
    Task<(string shortComment, string mediumComment)> GenerateCommentsAsync(string postSummary);
}

public class DraftGenerator : IDraftGenerator
{
    public Task<(string draft, string hashtags)> GeneratePostAsync(PostIdea idea, int variantNo)
    {
        // Authoritative DocSmith tone: concise, UAE WPS-aware, non-hype.
        var hook = variantNo switch
        {
            1 => $"Most WPS SIF rejections are caused by small formatting assumptions.",
            2 => $"A single incorrect field can delay salary processing. Not because payroll is hard, because formats are unforgiving.",
            _ => $"If your SIF file is almost right, it can still be rejected."
        };

        var body =
$@"{hook}

Topic: {idea.Topic}

What usually goes wrong:
- Leading zeros / field length mismatches
- Bank routing or identifier formatting
- Inconsistent employee identifiers across sheets
- File naming and structure assumptions

Practical fix:
Create a pre-check list and validate before upload, don't rely on Excel to look correct.

Question:
What's the most common reason your WPS file gets rejected?";

        var hashtags = "#UAE #WPS #Payroll #HRTech #Compliance";
        return Task.FromResult((body, hashtags));
    }

    public Task<(string shortComment, string mediumComment)> GenerateCommentsAsync(string postSummary)
    {
        var shortC = "Solid point. In payroll/WPS workflows, looks right isn't the same as valid format. Do you validate field lengths and identifiers before upload?";
        var mediumC =
$@"Agree. Most rejections I've seen aren't about the intent of the data, they're about strict structure rules (lengths, leading zeros, identifiers, file naming).
Curious: do you have a pre-check step before uploading, or is it mostly manual review?";

        return Task.FromResult((shortC, mediumC));
    }
}
