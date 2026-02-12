using DocSmith.Pulse.Core.Abstractions;
using DocSmith.Pulse.Core.Entities;
using DocSmith.Pulse.Core.Enums;
using DocSmith.Pulse.Infrastructure.Data;
using DocSmith.Pulse.Web.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DocSmith.Pulse.Web.Pages;

[RequiresPulseEnabled]
public class MediaStudioModel : PulsePageModelBase
{
    private readonly PulseDbContext _db;
    private readonly IInternetMediaSearchService _mediaSearch;
    private readonly ICreativeStudioService _creativeStudio;

    public MediaStudioModel(
        PulseDbContext db,
        ISafetyService safetyService,
        IAuditLogService auditLogService,
        IInternetMediaSearchService mediaSearch,
        ICreativeStudioService creativeStudio)
        : base(safetyService, auditLogService)
    {
        _db = db;
        _mediaSearch = mediaSearch;
        _creativeStudio = creativeStudio;
    }

    [BindProperty]
    public string SearchQuery { get; set; } = "";

    [BindProperty]
    public string ImagePrompt { get; set; } = "";

    [BindProperty]
    public string VideoPrompt { get; set; } = "";

    [BindProperty]
    public string DiagramPrompt { get; set; } = "";

    public List<InternetMediaResult> ImageSuggestions { get; set; } = new();
    public List<InternetMediaResult> VideoSuggestions { get; set; } = new();

    public GeneratedImageAsset? GeneratedImage { get; set; }
    public GeneratedVideoBrief? GeneratedVideo { get; set; }
    public GeneratedDiagram? GeneratedDiagram { get; set; }

    public List<MediaAsset> RecentMedia { get; set; } = new();

    public async Task OnGetAsync()
    {
        await LoadSafetyAsync();
        await LoadRecentMediaAsync();
    }

    public async Task<IActionResult> OnPostSearchMediaAsync()
    {
        await LoadSafetyAsync();

        var query = SearchQuery?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(query))
        {
            await LoadRecentMediaAsync();
            return Page();
        }

        ImageSuggestions = (await _mediaSearch.SearchImagesAsync(query, 8)).ToList();
        VideoSuggestions = (await _mediaSearch.SearchVideosAsync(query, 5)).ToList();

        foreach (var image in ImageSuggestions)
        {
            _db.MediaAssets.Add(new MediaAsset
            {
                MediaAssetType = MediaAssetType.ImageSuggestion,
                Query = query,
                Title = image.Title,
                Url = image.Url,
                ThumbnailUrl = image.ThumbnailUrl,
                Source = image.Source,
                ContentText = $"License={image.License}; Creator={image.Creator}"
            });
        }

        foreach (var video in VideoSuggestions)
        {
            _db.MediaAssets.Add(new MediaAsset
            {
                MediaAssetType = MediaAssetType.VideoSuggestion,
                Query = query,
                Title = video.Title,
                Url = video.Url,
                ThumbnailUrl = video.ThumbnailUrl,
                Source = video.Source,
                ContentText = $"License={video.License}; Creator={video.Creator}"
            });
        }

        await _db.SaveChangesAsync();

        await AuditAsync(
            "MediaSearched",
            nameof(MediaAsset),
            "batch",
            $"Query={query}; Images={ImageSuggestions.Count}; Videos={VideoSuggestions.Count}");

        await LoadRecentMediaAsync();
        return Page();
    }

    public async Task<IActionResult> OnPostGenerateImageAsync()
    {
        await LoadSafetyAsync();

        GeneratedImage = await _creativeStudio.GenerateImageAsync(ImagePrompt ?? string.Empty);

        _db.MediaAssets.Add(new MediaAsset
        {
            MediaAssetType = MediaAssetType.GeneratedImage,
            Query = ImagePrompt ?? string.Empty,
            Title = "Generated Image",
            Url = GeneratedImage.DataUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase) ? GeneratedImage.DataUrl : string.Empty,
            Source = GeneratedImage.IsGenerated ? "OpenAI" : "Template",
            Prompt = GeneratedImage.Prompt,
            ContentText = GeneratedImage.Notes
        });
        await _db.SaveChangesAsync();

        await AuditAsync("ImageGenerated", nameof(MediaAsset), "generated", $"Prompt={Truncate(ImagePrompt, 80)}; Generated={GeneratedImage.IsGenerated}");

        await LoadRecentMediaAsync();
        return Page();
    }

    public async Task<IActionResult> OnPostGenerateVideoAsync()
    {
        await LoadSafetyAsync();

        GeneratedVideo = await _creativeStudio.GenerateVideoBriefAsync(VideoPrompt ?? string.Empty);

        _db.MediaAssets.Add(new MediaAsset
        {
            MediaAssetType = MediaAssetType.GeneratedVideoBrief,
            Query = VideoPrompt ?? string.Empty,
            Title = "Generated Video Brief",
            Source = GeneratedVideo.IsGenerated ? "OpenAI" : "Template",
            Prompt = GeneratedVideo.Prompt,
            ContentText = GeneratedVideo.BriefText
        });
        await _db.SaveChangesAsync();

        await AuditAsync("VideoBriefGenerated", nameof(MediaAsset), "generated", $"Prompt={Truncate(VideoPrompt, 80)}; Generated={GeneratedVideo.IsGenerated}");

        await LoadRecentMediaAsync();
        return Page();
    }

    public async Task<IActionResult> OnPostGenerateDiagramAsync()
    {
        await LoadSafetyAsync();

        GeneratedDiagram = await _creativeStudio.GenerateDiagramAsync(DiagramPrompt ?? string.Empty);

        _db.MediaAssets.Add(new MediaAsset
        {
            MediaAssetType = MediaAssetType.GeneratedDiagram,
            Query = DiagramPrompt ?? string.Empty,
            Title = "Generated Diagram",
            Source = GeneratedDiagram.IsGenerated ? "OpenAI" : "Template",
            Prompt = GeneratedDiagram.Prompt,
            ContentText = GeneratedDiagram.MermaidText
        });
        await _db.SaveChangesAsync();

        await AuditAsync("DiagramGenerated", nameof(MediaAsset), "generated", $"Prompt={Truncate(DiagramPrompt, 80)}; Generated={GeneratedDiagram.IsGenerated}");

        await LoadRecentMediaAsync();
        return Page();
    }

    private async Task LoadRecentMediaAsync()
    {
        RecentMedia = await _db.MediaAssets
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(50)
            .ToListAsync();
    }

    private static string Truncate(string? value, int max)
    {
        if (string.IsNullOrEmpty(value) || value.Length <= max)
        {
            return value ?? string.Empty;
        }

        return value[..max];
    }
}
