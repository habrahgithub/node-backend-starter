using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Logging;

namespace Swd.Finstack.ControlCenter;

public class ControlCenterClient : IControlCenterClient
{
    private readonly HttpClient _httpClient;
    private readonly string _controlCenterEndpoint;
    private readonly string _tenantCode;
    private readonly ILogger<ControlCenterClient> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public ControlCenterClient(
        HttpClient httpClient,
        string controlCenterEndpoint,
        string tenantCode,
        ILogger<ControlCenterClient> logger)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _controlCenterEndpoint = controlCenterEndpoint ?? throw new ArgumentNullException(nameof(controlCenterEndpoint));
        _tenantCode = tenantCode ?? throw new ArgumentNullException(nameof(tenantCode));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };
    }

    public async Task<bool> IsConnectedAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _httpClient.GetAsync(
                $"{_controlCenterEndpoint}/health",
                cancellationToken);

            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to check Control Center connection");
            return false;
        }
    }

    public async Task<bool> RegisterDashboardAsync(string dashboardId, JsonObject dashboardConfig, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dashboardId))
            throw new ArgumentException("Dashboard ID cannot be null or empty", nameof(dashboardId));
        if (dashboardConfig == null)
            throw new ArgumentNullException(nameof(dashboardConfig));

        try
        {
            var request = new JsonObject
            {
                ["dashboardId"] = dashboardId,
                ["dashboardConfig"] = dashboardConfig,
                ["tenantCode"] = _tenantCode,
                ["timestamp"] = DateTimeOffset.UtcNow.ToString("o")
            };

            var response = await _httpClient.PostAsJsonAsync(
                $"{_controlCenterEndpoint}/dashboards/register",
                request,
                _jsonOptions,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to register dashboard with Control Center. Dashboard ID: {DashboardId}, Status: {StatusCode}, Content: {Content}",
                    dashboardId, response.StatusCode, errorContent);
                
                throw new InvalidOperationException(
                    $"Failed to register dashboard with Control Center: {response.StatusCode} - {errorContent}");
            }

            _logger.LogInformation("Dashboard registered with Control Center: {DashboardId}", dashboardId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering dashboard with Control Center: {DashboardId}", dashboardId);
            throw;
        }
    }

    public async Task<bool> UpdateMetricsAsync(string dashboardId, JsonObject metrics, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dashboardId))
            throw new ArgumentException("Dashboard ID cannot be null or empty", nameof(dashboardId));
        if (metrics == null)
            throw new ArgumentNullException(nameof(metrics));

        try
        {
            var request = new JsonObject
            {
                ["dashboardId"] = dashboardId,
                ["metrics"] = metrics,
                ["tenantCode"] = _tenantCode,
                ["timestamp"] = DateTimeOffset.UtcNow.ToString("o")
            };

            var response = await _httpClient.PostAsJsonAsync(
                $"{_controlCenterEndpoint}/dashboards/{Uri.EscapeDataString(dashboardId)}/metrics",
                request,
                _jsonOptions,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to update metrics with Control Center. Dashboard ID: {DashboardId}, Status: {StatusCode}, Content: {Content}",
                    dashboardId, response.StatusCode, errorContent);
                
                throw new InvalidOperationException(
                    $"Failed to update metrics with Control Center: {response.StatusCode} - {errorContent}");
            }

            _logger.LogInformation("Metrics updated with Control Center: {DashboardId}", dashboardId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating metrics with Control Center: {DashboardId}", dashboardId);
            throw;
        }
    }

    public async Task<bool> SendAlertAsync(string alertType, JsonObject alertDetails, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(alertType))
            throw new ArgumentException("Alert type cannot be null or empty", nameof(alertType));
        if (alertDetails == null)
            throw new ArgumentNullException(nameof(alertDetails));

        try
        {
            var request = new JsonObject
            {
                ["alertType"] = alertType,
                ["alertDetails"] = alertDetails,
                ["tenantCode"] = _tenantCode,
                ["timestamp"] = DateTimeOffset.UtcNow.ToString("o")
            };

            var response = await _httpClient.PostAsJsonAsync(
                $"{_controlCenterEndpoint}/alerts/send",
                request,
                _jsonOptions,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to send alert to Control Center. Alert Type: {AlertType}, Status: {StatusCode}, Content: {Content}",
                    alertType, response.StatusCode, errorContent);
                
                throw new InvalidOperationException(
                    $"Failed to send alert to Control Center: {response.StatusCode} - {errorContent}");
            }

            _logger.LogInformation("Alert sent to Control Center: {AlertType}", alertType);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending alert to Control Center: {AlertType}", alertType);
            throw;
        }
    }

    public async Task<bool> UpdateStatusAsync(string statusType, JsonObject statusDetails, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(statusType))
            throw new ArgumentException("Status type cannot be null or empty", nameof(statusType));
        if (statusDetails == null)
            throw new ArgumentNullException(nameof(statusDetails));

        try
        {
            var request = new JsonObject
            {
                ["statusType"] = statusType,
                ["statusDetails"] = statusDetails,
                ["tenantCode"] = _tenantCode,
                ["timestamp"] = DateTimeOffset.UtcNow.ToString("o")
            };

            var response = await _httpClient.PostAsJsonAsync(
                $"{_controlCenterEndpoint}/status/update",
                request,
                _jsonOptions,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to update status with Control Center. Status Type: {StatusType}, Status: {StatusCode}, Content: {Content}",
                    statusType, response.StatusCode, errorContent);
                
                throw new InvalidOperationException(
                    $"Failed to update status with Control Center: {response.StatusCode} - {errorContent}");
            }

            _logger.LogInformation("Status updated with Control Center: {StatusType}", statusType);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating status with Control Center: {StatusType}", statusType);
            throw;
        }
    }

    public async Task<bool> RegisterWidgetAsync(string dashboardId, string widgetId, JsonObject widgetConfig, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dashboardId))
            throw new ArgumentException("Dashboard ID cannot be null or empty", nameof(dashboardId));
        if (string.IsNullOrWhiteSpace(widgetId))
            throw new ArgumentException("Widget ID cannot be null or empty", nameof(widgetId));
        if (widgetConfig == null)
            throw new ArgumentNullException(nameof(widgetConfig));

        try
        {
            var request = new JsonObject
            {
                ["dashboardId"] = dashboardId,
                ["widgetId"] = widgetId,
                ["widgetConfig"] = widgetConfig,
                ["tenantCode"] = _tenantCode,
                ["timestamp"] = DateTimeOffset.UtcNow.ToString("o")
            };

            var response = await _httpClient.PostAsJsonAsync(
                $"{_controlCenterEndpoint}/dashboards/{Uri.EscapeDataString(dashboardId)}/widgets/register",
                request,
                _jsonOptions,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to register widget with Control Center. Dashboard ID: {DashboardId}, Widget ID: {WidgetId}, Status: {StatusCode}, Content: {Content}",
                    dashboardId, widgetId, response.StatusCode, errorContent);
                
                throw new InvalidOperationException(
                    $"Failed to register widget with Control Center: {response.StatusCode} - {errorContent}");
            }

            _logger.LogInformation("Widget registered with Control Center: {DashboardId}/{WidgetId}", dashboardId, widgetId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering widget with Control Center: {DashboardId}/{WidgetId}", dashboardId, widgetId);
            throw;
        }
    }

    public async Task<bool> UpdateWidgetDataAsync(string dashboardId, string widgetId, JsonObject widgetData, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dashboardId))
            throw new ArgumentException("Dashboard ID cannot be null or empty", nameof(dashboardId));
        if (string.IsNullOrWhiteSpace(widgetId))
            throw new ArgumentException("Widget ID cannot be null or empty", nameof(widgetId));
        if (widgetData == null)
            throw new ArgumentNullException(nameof(widgetData));

        try
        {
            var request = new JsonObject
            {
                ["dashboardId"] = dashboardId,
                ["widgetId"] = widgetId,
                ["widgetData"] = widgetData,
                ["tenantCode"] = _tenantCode,
                ["timestamp"] = DateTimeOffset.UtcNow.ToString("o")
            };

            var response = await _httpClient.PostAsJsonAsync(
                $"{_controlCenterEndpoint}/dashboards/{Uri.EscapeDataString(dashboardId)}/widgets/{Uri.EscapeDataString(widgetId)}/data",
                request,
                _jsonOptions,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to update widget data with Control Center. Dashboard ID: {DashboardId}, Widget ID: {WidgetId}, Status: {StatusCode}, Content: {Content}",
                    dashboardId, widgetId, response.StatusCode, errorContent);
                
                throw new InvalidOperationException(
                    $"Failed to update widget data with Control Center: {response.StatusCode} - {errorContent}");
            }

            _logger.LogInformation("Widget data updated with Control Center: {DashboardId}/{WidgetId}", dashboardId, widgetId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating widget data with Control Center: {DashboardId}/{WidgetId}", dashboardId, widgetId);
            throw;
        }
    }
}