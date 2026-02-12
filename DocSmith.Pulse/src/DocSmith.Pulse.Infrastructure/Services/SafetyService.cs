using DocSmith.Pulse.Core.Abstractions;
using DocSmith.Pulse.Core.Configuration;
using DocSmith.Pulse.Core.Entities;
using DocSmith.Pulse.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace DocSmith.Pulse.Infrastructure.Services;

public class SafetyService : ISafetyService
{
    private readonly PulseDbContext _db;
    private readonly IOptions<PulseOptions> _options;

    public SafetyService(PulseDbContext db, IOptions<PulseOptions> options)
    {
        _db = db;
        _options = options;
    }

    public async Task<SafetyState> GetStateAsync(CancellationToken cancellationToken = default)
    {
        var state = await _db.SafetyStates.FirstOrDefaultAsync(x => x.Id == SafetyState.SingletonId, cancellationToken);
        if (state != null)
        {
            return state;
        }

        state = new SafetyState();
        _db.SafetyStates.Add(state);
        await _db.SaveChangesAsync(cancellationToken);
        return state;
    }

    public async Task<SafetyState> UpdateAsync(
        bool globalKillSwitchEnabled,
        bool organizationSafeModeEnabled,
        bool aiGenerationEnabled,
        bool schedulerEnabled,
        bool exportsEnabled,
        CancellationToken cancellationToken = default)
    {
        var state = await GetStateAsync(cancellationToken);
        state.GlobalKillSwitchEnabled = globalKillSwitchEnabled;
        state.OrganizationSafeModeEnabled = organizationSafeModeEnabled;
        state.AiGenerationEnabled = aiGenerationEnabled;
        state.SchedulerEnabled = schedulerEnabled;
        state.ExportsEnabled = exportsEnabled;
        state.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return state;
    }

    public bool IsKillSwitchEffective(SafetyState state)
    {
        return state.GlobalKillSwitchEnabled || _options.Value.ForceKillSwitch;
    }
}
