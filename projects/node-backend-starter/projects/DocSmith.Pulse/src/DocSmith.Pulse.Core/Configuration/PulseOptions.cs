namespace DocSmith.Pulse.Core.Configuration;

public class PulseOptions
{
    public const string SectionName = "Pulse";

    public string GeneratorMode { get; set; } = "Template"; // Template | OpenAI
    public bool ForceKillSwitch { get; set; }
    public bool WatermarkExports { get; set; } = true;
    public string WatermarkText { get; set; } = "Prepared in DocSmith Pulse";
    public OpenAiOptions OpenAI { get; set; } = new();
}

public class OpenAiOptions
{
    public string ApiKey { get; set; } = "";
    public string Model { get; set; } = "gpt-4.1-mini";
    public string BaseUrl { get; set; } = "https://api.openai.com/v1";
}
