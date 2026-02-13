using DocSmith.Pulse.Core.Abstractions;
using DocSmith.Pulse.Core.Entities;
using DocSmith.Pulse.Core.Enums;

namespace DocSmith.Pulse.Infrastructure.Services;

public class TemplateDraftGenerator : IDraftGenerator
{
    public Task<GeneratedPostDraft> GeneratePostAsync(
        ContentIdea idea,
        BrandVoice voice,
        int variantNo,
        ChannelType channel = ChannelType.LinkedIn,
        CancellationToken cancellationToken = default)
    {
        var hook = variantNo switch
        {
            1 => "Most WPS SIF rejections are caused by small formatting assumptions.",
            2 => "A single incorrect field can delay salary processing because format rules are strict.",
            _ => "If your SIF file is almost right, it can still be rejected."
        };

        var contentTypeName = idea.ContentType switch
        {
            ContentType.Tip => "Tip",
            ContentType.Checklist => "Checklist",
            ContentType.MythVsFact => "Myth vs Fact",
            ContentType.MicroCase => "Micro-case",
            ContentType.FieldNote => "Field note",
            _ => "Insight"
        };

        var cta = idea.CtaStyle switch
        {
            CtaStyle.Soft => "If useful, I can share our pre-check template.",
            CtaStyle.Neutral => "What pre-check catches most errors in your workflow?",
            _ => ""
        };

        var body =
$@"{hook}

Format: {contentTypeName}
Persona: {idea.Persona}
Topic: {idea.Topic}

What usually breaks:
- Field length mismatches
- Leading zero truncation
- Bank code formatting assumptions
- Inconsistent employee identifiers across files

Key point:
{(string.IsNullOrWhiteSpace(idea.KeyPoint) ? "Validate structure before upload; visual checks are not enough." : idea.KeyPoint)}

Practical move:
Run a pre-upload validation checklist and reject invalid files before submission.

Question:
What is your most common WPS rejection reason?";

        if (!string.IsNullOrWhiteSpace(cta))
        {
            body = $"{body}\n\n{cta}";
        }

        var hashtags = channel switch
        {
            ChannelType.LinkedIn => "#UAE #WPS #Payroll #HRTech #Compliance",
            ChannelType.X => "#WPS #Payroll #UAE",
            ChannelType.Instagram => "#Payroll #HR #UAEBusiness #Compliance",
            ChannelType.YouTube => "#Payroll #WPS #SME",
            _ => "#Payroll #Compliance"
        };

        return Task.FromResult(new GeneratedPostDraft(body, hashtags));
    }

    public Task<GeneratedCommentDrafts> GenerateCommentsAsync(
        string postSummary,
        BrandVoice voice,
        CancellationToken cancellationToken = default)
    {
        var shortComment =
            "Strong point. In payroll workflows, looks correct is not the same as format-valid. Do you run a pre-check before upload?";

        var mediumComment =
$@"Agree with this. In most WPS cases, rejections come from strict structure rules: lengths, leading zeros, IDs, and naming.

Are you validating with a checklist before submission, or relying on manual review?";

        return Task.FromResult(new GeneratedCommentDrafts(shortComment, mediumComment));
    }
}
