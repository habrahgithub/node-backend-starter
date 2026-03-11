using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Swd.Finstack.Events;

namespace Swd.Finstack.Events;

public class SynapseEventPublisher : IEventPublisher
{
    private readonly HttpClient _httpClient;
    private readonly string _synapseEndpoint;
    private readonly string _tenantCode;
    private readonly ILogger<SynapseEventPublisher> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public SynapseEventPublisher(
        HttpClient httpClient,
        string synapseEndpoint,
        string tenantCode,
        ILogger<SynapseEventPublisher> logger)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _synapseEndpoint = synapseEndpoint ?? throw new ArgumentNullException(nameof(synapseEndpoint));
        _tenantCode = tenantCode ?? throw new ArgumentNullException(nameof(tenantCode));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };
    }

    public async Task PublishAsync(EventEnvelope @event, CancellationToken cancellationToken = default)
    {
        if (@event == null)
            throw new ArgumentNullException(nameof(@event));

        try
        {
            var response = await _httpClient.PostAsJsonAsync(
                $"{_synapseEndpoint}/events",
                @event,
                _jsonOptions,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to publish event to Synapse. Status: {StatusCode}, Content: {Content}",
                    response.StatusCode, errorContent);
                
                throw new InvalidOperationException(
                    $"Failed to publish event to Synapse: {response.StatusCode} - {errorContent}");
            }

            _logger.LogInformation(
                "Event published to Synapse: {EventId} - {EventType}",
                @event.EventId, @event.EventType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error publishing event to Synapse: {EventId}", @event.EventId);
            throw;
        }
    }

    public async Task PublishBatchAsync(IEnumerable<EventEnvelope> events, CancellationToken cancellationToken = default)
    {
        if (events == null)
            throw new ArgumentNullException(nameof(events));

        var eventList = events.ToList();
        if (!eventList.Any())
            return;

        try
        {
            var response = await _httpClient.PostAsJsonAsync(
                $"{_synapseEndpoint}/events/batch",
                eventList,
                _jsonOptions,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to publish batch events to Synapse. Status: {StatusCode}, Content: {Content}",
                    response.StatusCode, errorContent);
                
                throw new InvalidOperationException(
                    $"Failed to publish batch events to Synapse: {response.StatusCode} - {errorContent}");
            }

            _logger.LogInformation(
                "Batch of {Count} events published to Synapse",
                eventList.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error publishing batch events to Synapse");
            throw;
        }
    }

    public async Task<bool> IsConnectedAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _httpClient.GetAsync(
                $"{_synapseEndpoint}/health",
                cancellationToken);

            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to check Synapse connection");
            return false;
        }
    }
}