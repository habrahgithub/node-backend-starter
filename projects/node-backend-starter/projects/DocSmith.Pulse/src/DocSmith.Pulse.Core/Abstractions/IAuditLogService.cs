namespace DocSmith.Pulse.Core.Abstractions;

public interface IAuditLogService
{
    Task LogAsync(
        string action,
        string entityType,
        string entityId,
        string inputSummary,
        string sourcePath,
        bool wasBlocked = false,
        string reason = "",
        string actor = "LocalUser",
        CancellationToken cancellationToken = default);
}
