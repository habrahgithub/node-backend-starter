using System.Text.Encodings.Web;
using System.Text.Json;
using DocSmith.Pulse.Core.Abstractions;
using Microsoft.Extensions.Logging;

namespace DocSmith.Pulse.Infrastructure.Services;

public class OpenverseMediaSearchService : IInternetMediaSearchService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<OpenverseMediaSearchService> _logger;

    public OpenverseMediaSearchService(HttpClient httpClient, ILogger<OpenverseMediaSearchService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public Task<IReadOnlyList<InternetMediaResult>> SearchImagesAsync(string query, int limit = 8, CancellationToken cancellationToken = default)
    {
        return SearchAsync("images", query, limit, cancellationToken);
    }

    public Task<IReadOnlyList<InternetMediaResult>> SearchVideosAsync(string query, int limit = 5, CancellationToken cancellationToken = default)
    {
        return SearchAsync("videos", query, limit, cancellationToken);
    }

    private async Task<IReadOnlyList<InternetMediaResult>> SearchAsync(string mediaType, string query, int limit, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return Array.Empty<InternetMediaResult>();
        }

        var encoded = UrlEncoder.Default.Encode(query.Trim());
        var url = $"https://api.openverse.org/v1/{mediaType}?q={encoded}&page_size={Math.Clamp(limit, 1, 20)}";

        try
        {
            using var response = await _httpClient.GetAsync(url, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Openverse request failed ({StatusCode}) for query {Query}", (int)response.StatusCode, query);
                return Array.Empty<InternetMediaResult>();
            }

            using var doc = JsonDocument.Parse(body);
            if (!doc.RootElement.TryGetProperty("results", out var results) || results.ValueKind != JsonValueKind.Array)
            {
                return Array.Empty<InternetMediaResult>();
            }

            var output = new List<InternetMediaResult>();
            foreach (var item in results.EnumerateArray())
            {
                var title = GetString(item, "title");
                var assetUrl = GetString(item, "url");
                var thumbnail = GetString(item, "thumbnail");
                var creator = GetString(item, "creator");
                var license = GetString(item, "license");
                var source = GetString(item, "source");
                var landing = GetString(item, "foreign_landing_url");

                if (string.IsNullOrWhiteSpace(assetUrl) && string.IsNullOrWhiteSpace(landing))
                {
                    continue;
                }

                output.Add(new InternetMediaResult(
                    Title: string.IsNullOrWhiteSpace(title) ? "Untitled" : title,
                    Url: string.IsNullOrWhiteSpace(landing) ? assetUrl : landing,
                    ThumbnailUrl: thumbnail,
                    Source: source,
                    License: license,
                    Creator: creator));
            }

            return output;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Openverse search failed for query {Query}", query);
            return Array.Empty<InternetMediaResult>();
        }
    }

    private static string GetString(JsonElement item, string propertyName)
    {
        if (item.TryGetProperty(propertyName, out var value) && value.ValueKind == JsonValueKind.String)
        {
            return value.GetString() ?? string.Empty;
        }

        return string.Empty;
    }
}
