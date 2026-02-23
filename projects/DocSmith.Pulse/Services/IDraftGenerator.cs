using DocSmith.Pulse.Models;

namespace DocSmith.Pulse.Services;

public interface IDraftGenerator
{
    Task<(string draft, string hashtags)> GeneratePostAsync(PostIdea idea, int variantNo);
    Task<(string shortComment, string mediumComment)> GenerateCommentsAsync(string postSummary);
}
