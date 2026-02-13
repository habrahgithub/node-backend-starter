using DocSmith.Pulse.Core.Abstractions;
using DocSmith.Pulse.Core.Entities;
using DocSmith.Pulse.Infrastructure.Data;

namespace DocSmith.Pulse.Infrastructure.Services;

public class AuditLogService : IAuditLogService
{
    private readonly PulseDbContext _db;

    public AuditLogService(PulseDbContext db)
    {
        _db = db;
    }

    public async Task LogAsync(
        string action,
        string entityType,
        string entityId,
        string inputSummary,
        string sourcePath,
        bool wasBlocked = false,
        string reason = "",
        string actor = "LocalUser",
        CancellationToken cancellationToken = default)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            OccurredAtUtc = DateTime.UtcNow,
            Actor = actor,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            InputSummary = inputSummary,
            SourcePath = sourcePath,
            WasBlocked = wasBlocked,
            Reason = reason
        });

        await _db.SaveChangesAsync(cancellationToken);
    }
}
