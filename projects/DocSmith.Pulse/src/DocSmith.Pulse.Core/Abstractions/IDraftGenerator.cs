using DocSmith.Pulse.Core.Entities;
using DocSmith.Pulse.Core.Enums;

namespace DocSmith.Pulse.Core.Abstractions;

public interface IDraftGenerator
{
    Task<GeneratedPostDraft> GeneratePostAsync(
        ContentIdea idea,
        BrandVoice voice,
        int variantNo,
        ChannelType channel = ChannelType.LinkedIn,
        CancellationToken cancellationToken = default);

    Task<GeneratedCommentDrafts> GenerateCommentsAsync(
        string postSummary,
        BrandVoice voice,
        CancellationToken cancellationToken = default);
}

public record GeneratedPostDraft(string DraftText, string Hashtags);
public record GeneratedCommentDrafts(string ShortComment, string MediumComment);
