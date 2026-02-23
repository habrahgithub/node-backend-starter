namespace DocSmith.Pulse.Core.Abstractions;

public interface ICreativeStudioService
{
    Task<GeneratedImageAsset> GenerateImageAsync(string prompt, CancellationToken cancellationToken = default);
    Task<GeneratedVideoBrief> GenerateVideoBriefAsync(string prompt, CancellationToken cancellationToken = default);
    Task<GeneratedDiagram> GenerateDiagramAsync(string prompt, CancellationToken cancellationToken = default);
}

public record GeneratedImageAsset(bool IsGenerated, string Prompt, string DataUrl, string Notes);
public record GeneratedVideoBrief(bool IsGenerated, string Prompt, string BriefText, string Notes);
public record GeneratedDiagram(bool IsGenerated, string Prompt, string MermaidText, string Notes);
