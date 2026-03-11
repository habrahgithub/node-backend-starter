using Swd.Finstack.Events;

namespace Swd.Finstack.Events;

public interface IEventPublisher
{
    Task PublishAsync(EventEnvelope @event, CancellationToken cancellationToken = default);
    Task PublishBatchAsync(IEnumerable<EventEnvelope> events, CancellationToken cancellationToken = default);
    Task<bool> IsConnectedAsync(CancellationToken cancellationToken = default);
}