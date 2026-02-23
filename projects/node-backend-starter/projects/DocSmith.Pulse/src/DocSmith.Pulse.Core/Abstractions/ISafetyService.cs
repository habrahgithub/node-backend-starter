using DocSmith.Pulse.Core.Entities;

namespace DocSmith.Pulse.Core.Abstractions;

public interface ISafetyService
{
    Task<SafetyState> GetStateAsync(CancellationToken cancellationToken = default);

    Task<SafetyState> UpdateAsync(
        bool globalKillSwitchEnabled,
        bool organizationSafeModeEnabled,
        bool aiGenerationEnabled,
        bool schedulerEnabled,
        bool exportsEnabled,
        CancellationToken cancellationToken = default);

    bool IsKillSwitchEffective(SafetyState state);
}
