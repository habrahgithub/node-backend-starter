using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using DocSmith.Pulse.Core.Abstractions;
using DocSmith.Pulse.Core.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DocSmith.Pulse.Infrastructure.Services;

public class CreativeStudioService : ICreativeStudioService
{
    private readonly HttpClient _httpClient;
    private readonly PulseOptions _options;
    private readonly ISafetyService _safetyService;
    private readonly ILogger<CreativeStudioService> _logger;

    public CreativeStudioService(
        HttpClient httpClient,
        IOptions<PulseOptions> options,
        ISafetyService safetyService,
        ILogger<CreativeStudioService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _safetyService = safetyService;
        _logger = logger;
    }

    public async Task<GeneratedImageAsset> GenerateImageAsync(string prompt, CancellationToken cancellationToken = default)
    {
        var cleanedPrompt = (prompt ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(cleanedPrompt))
        {
            return new GeneratedImageAsset(false, cleanedPrompt, string.Empty, "Prompt is required.");
        }

        var state = await _safetyService.GetStateAsync(cancellationToken);
        if (!state.AiGenerationEnabled)
        {
            return new GeneratedImageAsset(false, cleanedPrompt, string.Empty, "AI generation disabled by Safety settings.");
        }

        if (string.IsNullOrWhiteSpace(_options.OpenAI.ApiKey))
        {
            return new GeneratedImageAsset(false, cleanedPrompt, string.Empty, "OpenAI API key not configured.");
        }

        try
        {
            var baseUrl = string.IsNullOrWhiteSpace(_options.OpenAI.BaseUrl)
                ? "https://api.openai.com/v1"
                : _options.OpenAI.BaseUrl.TrimEnd('/');

            var payload = new
            {
                model = "gpt-image-1",
                prompt = cleanedPrompt,
                size = "1024x1024"
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/images/generations")
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };

            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.OpenAI.ApiKey);

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Image generation failed ({StatusCode})", (int)response.StatusCode);
                return new GeneratedImageAsset(false, cleanedPrompt, string.Empty, $"Generation failed: {(int)response.StatusCode}");
            }

            using var doc = JsonDocument.Parse(body);
            if (!doc.RootElement.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Array)
            {
                return new GeneratedImageAsset(false, cleanedPrompt, string.Empty, "No image data returned.");
            }

            var first = data.EnumerateArray().FirstOrDefault();
            if (first.ValueKind == JsonValueKind.Undefined)
            {
                return new GeneratedImageAsset(false, cleanedPrompt, string.Empty, "No image variants returned.");
            }

            if (first.TryGetProperty("b64_json", out var b64Prop) && b64Prop.ValueKind == JsonValueKind.String)
            {
                var b64 = b64Prop.GetString();
                if (!string.IsNullOrWhiteSpace(b64))
                {
                    var dataUrl = $"data:image/png;base64,{b64}";
                    return new GeneratedImageAsset(true, cleanedPrompt, dataUrl, "Image generated successfully.");
                }
            }

            if (first.TryGetProperty("url", out var urlProp) && urlProp.ValueKind == JsonValueKind.String)
            {
                var url = urlProp.GetString() ?? string.Empty;
                return new GeneratedImageAsset(true, cleanedPrompt, url, "Image URL returned by provider.");
            }

            return new GeneratedImageAsset(false, cleanedPrompt, string.Empty, "Unsupported image response format.");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Image generation threw exception.");
            return new GeneratedImageAsset(false, cleanedPrompt, string.Empty, "Image generation failed unexpectedly.");
        }
    }

    public async Task<GeneratedVideoBrief> GenerateVideoBriefAsync(string prompt, CancellationToken cancellationToken = default)
    {
        var cleanedPrompt = (prompt ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(cleanedPrompt))
        {
            return new GeneratedVideoBrief(false, cleanedPrompt, string.Empty, "Prompt is required.");
        }

        var fallbackBrief =
$@"Video Brief
- Goal: Explain {cleanedPrompt}
- Format: 30-45 sec LinkedIn style clip
- Structure: Hook (5s) -> Problem (10s) -> Practical fix (15s) -> CTA (5s)
- Visuals: Product UI snippets + compliance checklist overlays
- Tone: Professional, concise, non-hype";

        var state = await _safetyService.GetStateAsync(cancellationToken);
        if (!state.AiGenerationEnabled || string.IsNullOrWhiteSpace(_options.OpenAI.ApiKey))
        {
            return new GeneratedVideoBrief(false, cleanedPrompt, fallbackBrief, "AI disabled or API key missing, returned template brief.");
        }

        try
        {
            var systemPrompt = "You create concise production-ready social video briefs for B2B content marketing. Return plain text.";
            var userPrompt =
$@"Create a short video brief for this topic:
{cleanedPrompt}

Target: LinkedIn professional audience
Length: 30-45 seconds
Need: shot-by-shot outline, narration lines, overlay text, CTA.";

            var brief = await GenerateTextAsync(systemPrompt, userPrompt, cancellationToken);
            if (string.IsNullOrWhiteSpace(brief))
            {
                return new GeneratedVideoBrief(false, cleanedPrompt, fallbackBrief, "Model returned empty output, used template brief.");
            }

            return new GeneratedVideoBrief(true, cleanedPrompt, brief.Trim(), "AI-generated video brief.");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Video brief generation failed.");
            return new GeneratedVideoBrief(false, cleanedPrompt, fallbackBrief, "Generation failed, returned template brief.");
        }
    }

    public async Task<GeneratedDiagram> GenerateDiagramAsync(string prompt, CancellationToken cancellationToken = default)
    {
        var cleanedPrompt = (prompt ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(cleanedPrompt))
        {
            return new GeneratedDiagram(false, cleanedPrompt, string.Empty, "Prompt is required.");
        }

        var fallbackMermaid =
$@"flowchart LR
    A[""Topic: {EscapeMermaid(cleanedPrompt)}""] --> B[""Research Inputs""]
    B --> C[""Draft Content""]
    C --> D[""Safety & Brand Check""]
    D --> E[""Approve""]
    E --> F[""Manual Publish""]
    F --> G[""Log Metrics""]";

        var state = await _safetyService.GetStateAsync(cancellationToken);
        if (!state.AiGenerationEnabled || string.IsNullOrWhiteSpace(_options.OpenAI.ApiKey))
        {
            return new GeneratedDiagram(false, cleanedPrompt, fallbackMermaid, "AI disabled or API key missing, returned template diagram.");
        }

        try
        {
            var systemPrompt = "You generate Mermaid flowcharts only. Use flowchart LR syntax and quote all node text.";
            var userPrompt =
$@"Create a concise workflow diagram for:
{cleanedPrompt}

Requirements:
- Use flowchart LR
- 6 to 9 nodes
- Text-only, no emojis
- Return Mermaid code only.";

            var mermaid = await GenerateTextAsync(systemPrompt, userPrompt, cancellationToken);
            if (string.IsNullOrWhiteSpace(mermaid))
            {
                return new GeneratedDiagram(false, cleanedPrompt, fallbackMermaid, "Model returned empty output, used template diagram.");
            }

            return new GeneratedDiagram(true, cleanedPrompt, mermaid.Trim(), "AI-generated diagram.");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Diagram generation failed.");
            return new GeneratedDiagram(false, cleanedPrompt, fallbackMermaid, "Generation failed, returned template diagram.");
        }
    }

    private async Task<string> GenerateTextAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken)
    {
        var baseUrl = string.IsNullOrWhiteSpace(_options.OpenAI.BaseUrl)
            ? "https://api.openai.com/v1"
            : _options.OpenAI.BaseUrl.TrimEnd('/');

        var payload = new
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
            max_output_tokens = 900
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
            throw new InvalidOperationException($"OpenAI text generation failed with status {(int)response.StatusCode}: {body}");
        }

        using var doc = JsonDocument.Parse(body);
        if (doc.RootElement.TryGetProperty("output_text", out var outputText) && outputText.ValueKind == JsonValueKind.String)
        {
            return outputText.GetString() ?? string.Empty;
        }

        return string.Empty;
    }

    private static string EscapeMermaid(string text)
    {
        return text.Replace("\"", "'");
    }
}
