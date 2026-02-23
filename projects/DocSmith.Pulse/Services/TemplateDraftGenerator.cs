using DocSmith.Pulse.Models;

namespace DocSmith.Pulse.Services;

public class TemplateDraftGenerator : IDraftGenerator
{
    public Task<(string draft, string hashtags)> GeneratePostAsync(PostIdea idea, int variantNo)
    {
        var hook = variantNo switch
        {
            1 => "Most WPS SIF rejections are caused by small formatting assumptions.",
            2 => "A single incorrect field can delay salary processing because formats are strict.",
            _ => "If your SIF file is almost right, it can still be rejected."
        };

        var personaLine = string.IsNullOrWhiteSpace(idea.Persona)
            ? "For operations teams:"
            : $"For {idea.Persona}:";

        var cta = idea.CtaStyle switch
        {
            "Soft" => "If useful, I can share a simple pre-check structure we use before upload.",
            "Neutral" => "What pre-check step has saved your team the most time?",
            _ => ""
        };

        var body =
$@"{hook}

Topic: {idea.Topic}
Post Type: {idea.PostType}

{personaLine}
What usually goes wrong:
- Leading zeros or field length mismatches
- Bank or identifier formatting issues
- Inconsistent employee identifiers across files
- File naming and structure assumptions

Key point:
{(string.IsNullOrWhiteSpace(idea.KeyPoint) ? "Validate exact structure before upload; visual checks are not enough." : idea.KeyPoint)}

Practical fix:
Use a pre-upload checklist and validate each required field before submitting.

Question:
What is the most common reason your WPS file gets rejected?";

        if (!string.IsNullOrWhiteSpace(cta))
        {
            body = $"{body}\n\n{cta}";
        }

        var hashtags = "#UAE #WPS #Payroll #HRTech #Compliance";
        return Task.FromResult((body, hashtags));
    }

    public Task<(string shortComment, string mediumComment)> GenerateCommentsAsync(string postSummary)
    {
        var shortComment =
            "Strong point. In payroll workflows, looks correct is not the same as format-valid. Do you run a pre-check before upload?";

        var mediumComment =
$@"Agree with this. Most payroll rejections I see are not intent issues, they are strict structure issues: field lengths, leading zeros, IDs, and file naming.

I am curious if your team has a standard pre-check, or if review is mostly manual today.";

        return Task.FromResult((shortComment, mediumComment));
    }
}
