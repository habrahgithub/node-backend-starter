using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using DocSmith.Pulse.Core.Abstractions;
using DocSmith.Pulse.Core.Configuration;
using DocSmith.Pulse.Core.Entities;
using DocSmith.Pulse.Core.Enums;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DocSmith.Pulse.Infrastructure.Services;

public class OpenAiDraftGenerator : IDraftGenerator
{
    private readonly HttpClient _httpClient;
    private readonly PulseOptions _options;
    private readonly ISafetyService _safetyService;
    private readonly TemplateDraftGenerator _fallback;
    private readonly ILogger<OpenAiDraftGenerator> _logger;

    public OpenAiDraftGenerator(
        HttpClient httpClient,
        IOptions<PulseOptions> options,
        ISafetyService safetyService,
        TemplateDraftGenerator fallback,
        ILogger<OpenAiDraftGenerator> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _safetyService = safetyService;
        _fallback = fallback;
        _logger = logger;
    }

    public async Task<GeneratedPostDraft> GeneratePostAsync(
        ContentIdea idea,
        BrandVoice voice,
        int variantNo,
        ChannelType channel = ChannelType.LinkedIn,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var systemPrompt =
                "You are writing professional marketing content for DocSmith. Style: authoritative, compliance-aware, concise, no hype, no emojis unless asked.";

            var userPrompt =
$@"Generate one {channel} draft and hashtags.

Persona: {idea.Persona}
Type: {idea.ContentType}
Topic: {idea.Topic}
Key point: {idea.KeyPoint}
CTA style: {idea.CtaStyle}
Tone rules: {voice.ToneRules}
Forbidden claims: {voice.ForbiddenClaimsCsv}

Return strict JSON only:
{{""draftText"":""..."",""hashtags"":""#a #b""}}";

            var output = await SendPromptAsync(systemPrompt, userPrompt, cancellationToken);
            var json = ExtractJson(output);
            using var doc = JsonDocument.Parse(json);

            var draft = doc.RootElement.GetProperty("draftText").GetString() ?? "";
            var hashtags = doc.RootElement.GetProperty("hashtags").GetString() ?? "";

            if (string.IsNullOrWhiteSpace(draft) || string.IsNullOrWhiteSpace(hashtags))
            {
                throw new InvalidOperationException("OpenAI response missing draft fields.");
            }

            return new GeneratedPostDraft(draft.Trim(), hashtags.Trim());
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "OpenAI post generation failed. Falling back to template generator.");
            return await _fallback.GeneratePostAsync(idea, voice, variantNo, channel, cancellationToken);
        }
    }

    public async Task<GeneratedCommentDrafts> GenerateCommentsAsync(
        string postSummary,
        BrandVoice voice,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var systemPrompt =
                "Generate respectful, useful LinkedIn comment drafts. Keep tone professional, specific, and concise.";

            var userPrompt =
$@"Create short and medium comments for this summary:
{postSummary}

Tone rules: {voice.ToneRules}
Forbidden claims: {voice.ForbiddenClaimsCsv}

Return strict JSON only:
{{""shortComment"":""..."",""mediumComment"":""...""}}";

            var output = await SendPromptAsync(systemPrompt, userPrompt, cancellationToken);
            var json = ExtractJson(output);
            using var doc = JsonDocument.Parse(json);

            var shortComment = doc.RootElement.GetProperty("shortComment").GetString() ?? "";
            var mediumComment = doc.RootElement.GetProperty("mediumComment").GetString() ?? "";

            if (string.IsNullOrWhiteSpace(shortComment) || string.IsNullOrWhiteSpace(mediumComment))
            {
                throw new InvalidOperationException("OpenAI response missing comment fields.");
            }

            return new GeneratedCommentDrafts(shortComment.Trim(), mediumComment.Trim());
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "OpenAI comment generation failed. Falling back to template generator.");
            return await _fallback.GenerateCommentsAsync(postSummary, voice, cancellationToken);
        }
    }

    private async Task<string> SendPromptAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken)
    {
        var state = await _safetyService.GetStateAsync(cancellationToken);
        if (!state.AiGenerationEnabled)
        {
            throw new InvalidOperationException("AI generation is disabled by SafetyState.");
        }

        if (string.IsNullOrWhiteSpace(_options.OpenAI.ApiKey))
        {
            throw new InvalidOperationException("Pulse:OpenAI:ApiKey not configured.");
        }

        var model = string.IsNullOrWhiteSpace(_options.OpenAI.Model) ? "gpt-4.1-mini" : _options.OpenAI.Model;
        var baseUrl = string.IsNullOrWhiteSpace(_options.OpenAI.BaseUrl)
            ? "https://api.openai.com/v1"
            : _options.OpenAI.BaseUrl.TrimEnd('/');

        var payload = new
        {
            model,
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
            max_output_tokens = 700
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/responses")
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.OpenAI.ApiKey);

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"OpenAI request failed: {(int)response.StatusCode} {body}");
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
                    if (part.TryGetProperty("type", out var typeProp) &&
                        typeProp.ValueKind == JsonValueKind.String &&
                        typeProp.GetString() == "output_text" &&
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

        throw new InvalidOperationException("OpenAI output parsing failed.");
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

        throw new InvalidOperationException("Model output did not include JSON.");
    }
}
