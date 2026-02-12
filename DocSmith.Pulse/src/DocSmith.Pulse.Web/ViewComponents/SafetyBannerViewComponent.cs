using DocSmith.Pulse.Core.Abstractions;
using DocSmith.Pulse.Web.Models;
using Microsoft.AspNetCore.Mvc;

namespace DocSmith.Pulse.Web.ViewComponents;

public class SafetyBannerViewComponent : ViewComponent
{
    private readonly ISafetyService _safetyService;

    public SafetyBannerViewComponent(ISafetyService safetyService)
    {
        _safetyService = safetyService;
    }

    public async Task<IViewComponentResult> InvokeAsync()
    {
        var state = await _safetyService.GetStateAsync();

        var vm = new SafetyBannerVm
        {
            IsKillSwitchEnabled = _safetyService.IsKillSwitchEffective(state),
            IsSafeModeEnabled = state.OrganizationSafeModeEnabled,
            AiGenerationEnabled = state.AiGenerationEnabled,
            SchedulerEnabled = state.SchedulerEnabled,
            ExportsEnabled = state.ExportsEnabled
        };

        return View(vm);
    }
}
