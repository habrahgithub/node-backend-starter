using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using DocSmith.Pulse.Models;
using DocSmith.Pulse.Options;
using Microsoft.Extensions.Options;

namespace DocSmith.Pulse.Services;

public class OpenAiDraftGenerator : IDraftGenerator
{
    private readonly HttpClient _httpClient;
    private readonly TemplateDraftGenerator _fallback;
    private readonly PulseOptions _options;
    private readonly ILogger<OpenAiDraftGenerator> _logger;

    public OpenAiDraftGenerator(
        HttpClient httpClient,
        IOptions<PulseOptions> options,
        TemplateDraftGenerator fallback,
        ILogger<OpenAiDraftGenerator> logger)
    {
        _httpClient = httpClient;
        _fallback = fallback;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<(string draft, string hashtags)> GeneratePostAsync(PostIdea idea, int variantNo)
    {
        try
        {
            var systemPrompt =
                "You write concise, practical LinkedIn copy for DocSmith about UAE payroll and WPS. Avoid hype. Keep language direct and clear.";

            var userPrompt =
$@"Generate one LinkedIn post draft and hashtags.

Variant: {variantNo}
Topic: {idea.Topic}
Persona: {idea.Persona}
PostType: {idea.PostType}
KeyPoint: {idea.KeyPoint}
CtaStyle: {idea.CtaStyle}

Return strict JSON only:
{{""draft"":""..."",""hashtags"":""#one #two""}}";

            var modelOutput = await SendPromptAsync(systemPrompt, userPrompt);
            var json = ExtractJson(modelOutput);
            using var doc = JsonDocument.Parse(json);

            var draft = doc.RootElement.GetProperty("draft").GetString() ?? "";
            var hashtags = doc.RootElement.GetProperty("hashtags").GetString() ?? "";

            if (string.IsNullOrWhiteSpace(draft) || string.IsNullOrWhiteSpace(hashtags))
            {
                throw new InvalidOperationException("OpenAI response missing draft or hashtags.");
            }

            return (draft.Trim(), hashtags.Trim());
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "OpenAI post generation failed. Falling back to template generator.");
            return await _fallback.GeneratePostAsync(idea, variantNo);
        }
    }

    public async Task<(string shortComment, string mediumComment)> GenerateCommentsAsync(string postSummary)
    {
        try
        {
            var systemPrompt =
                "You write professional LinkedIn comment drafts for DocSmith. Keep comments useful, respectful, and specific.";

            var userPrompt =
$@"Create two comment variants for this post summary:
{postSummary}

Return strict JSON only:
{{""shortComment"":""..."",""mediumComment"":""...""}}";

            var modelOutput = await SendPromptAsync(systemPrompt, userPrompt);
            var json = ExtractJson(modelOutput);
            using var doc = JsonDocument.Parse(json);

            var shortComment = doc.RootElement.GetProperty("shortComment").GetString() ?? "";
            var mediumComment = doc.RootElement.GetProperty("mediumComment").GetString() ?? "";

            if (string.IsNullOrWhiteSpace(shortComment) || string.IsNullOrWhiteSpace(mediumComment))
            {
                throw new InvalidOperationException("OpenAI response missing comment variants.");
            }

            return (shortComment.Trim(), mediumComment.Trim());
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "OpenAI comment generation failed. Falling back to template generator.");
            return await _fallback.GenerateCommentsAsync(postSummary);
        }
    }

    private async Task<string> SendPromptAsync(string systemPrompt, string userPrompt)
    {
        if (string.IsNullOrWhiteSpace(_options.OpenAI.ApiKey))
        {
            throw new InvalidOperationException("Pulse:OpenAI:ApiKey is not configured.");
        }

        var request = new
        {
            model = string.IsNullOrWhiteSpace(_options.OpenAI.Model) ? "gpt-4.1-mini" : _options.OpenAI.Model,
            input = new object[]
            {
                new
                {
                    role = "system",
                    content = new object[]
                    {
                        new { type = "input_text", text = systemPrompt }
                    }
                },
                new
                {
                    role = "user",
                    content = new object[]
                    {
                        new { type = "input_text", text = userPrompt }
                    }
                }
            },
            max_output_tokens = 600
        };

        var baseUrl = string.IsNullOrWhiteSpace(_options.OpenAI.BaseUrl)
            ? "https://api.openai.com/v1"
            : _options.OpenAI.BaseUrl.TrimEnd('/');

        using var message = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/responses")
        {
            Content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json")
        };

        message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.OpenAI.ApiKey);

        using var response = await _httpClient.SendAsync(message);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"OpenAI API request failed with status {(int)response.StatusCode}: {body}");
        }

        using var doc = JsonDocument.Parse(body);
        if (doc.RootElement.TryGetProperty("output_text", out var outputText) &&
            outputText.ValueKind == JsonValueKind.String)
        {
            var text = outputText.GetString();
            if (!string.IsNullOrWhiteSpace(text))
            {
                return text;
            }
        }

        if (doc.RootElement.TryGetProperty("output", out var output) && output.ValueKind == JsonValueKind.Array)
        {
            var sb = new StringBuilder();
            foreach (var item in output.EnumerateArray())
            {
                if (!item.TryGetProperty("content", out var content) || content.ValueKind != JsonValueKind.Array)
                {
                    continue;
                }

                foreach (var part in content.EnumerateArray())
                {
                    if (part.TryGetProperty("type", out var type) &&
                        type.ValueKind == JsonValueKind.String &&
                        type.GetString() == "output_text" &&
                        part.TryGetProperty("text", out var textProp) &&
                        textProp.ValueKind == JsonValueKind.String)
                    {
                        sb.AppendLine(textProp.GetString());
                    }
                }
            }

            var combined = sb.ToString().Trim();
            if (!string.IsNullOrWhiteSpace(combined))
            {
                return combined;
            }
        }

        throw new InvalidOperationException("Could not parse output text from OpenAI response.");
    }

    private static string ExtractJson(string content)
    {
        var trimmed = content.Trim();
        var start = trimmed.IndexOf('{');
        var end = trimmed.LastIndexOf('}');

        if (start >= 0 && end > start)
        {
            return trimmed[start..(end + 1)];
        }

        throw new InvalidOperationException("Model output did not contain a JSON object.");
    }
}
