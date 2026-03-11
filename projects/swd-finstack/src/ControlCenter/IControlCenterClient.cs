using System.Text.Json.Nodes;

namespace Swd.Finstack.ControlCenter;

public interface IControlCenterClient
{
    Task<bool> IsConnectedAsync(CancellationToken cancellationToken = default);
    Task<bool> RegisterDashboardAsync(string dashboardId, JsonObject dashboardConfig, CancellationToken cancellationToken = default);
    Task<bool> UpdateMetricsAsync(string dashboardId, JsonObject metrics, CancellationToken cancellationToken = default);
    Task<bool> SendAlertAsync(string alertType, JsonObject alertDetails, CancellationToken cancellationToken = default);
    Task<bool> UpdateStatusAsync(string statusType, JsonObject statusDetails, CancellationToken cancellationToken = default);
    Task<bool> RegisterWidgetAsync(string dashboardId, string widgetId, JsonObject widgetConfig, CancellationToken cancellationToken = default);
    Task<bool> UpdateWidgetDataAsync(string dashboardId, string widgetId, JsonObject widgetData, CancellationToken cancellationToken = default);
}