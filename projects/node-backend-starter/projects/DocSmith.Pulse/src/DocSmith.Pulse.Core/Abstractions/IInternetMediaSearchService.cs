namespace DocSmith.Pulse.Core.Abstractions;

public interface IInternetMediaSearchService
{
    Task<IReadOnlyList<InternetMediaResult>> SearchImagesAsync(string query, int limit = 8, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<InternetMediaResult>> SearchVideosAsync(string query, int limit = 5, CancellationToken cancellationToken = default);
}

public record InternetMediaResult(
    string Title,
    string Url,
    string ThumbnailUrl,
    string Source,
    string License,
    string Creator);
