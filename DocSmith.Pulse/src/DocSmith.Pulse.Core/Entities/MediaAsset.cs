using DocSmith.Pulse.Core.Enums;

namespace DocSmith.Pulse.Core.Entities;

public class MediaAsset
{
    public int Id { get; set; }
    public MediaAssetType MediaAssetType { get; set; }
    public string Query { get; set; } = "";
    public string Title { get; set; } = "";
    public string Url { get; set; } = "";
    public string ThumbnailUrl { get; set; } = "";
    public string Source { get; set; } = "";
    public string Prompt { get; set; } = "";
    public string ContentText { get; set; } = "";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
