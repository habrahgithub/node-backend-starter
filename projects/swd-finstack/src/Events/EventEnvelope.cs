using System.Text.Json.Serialization;

namespace Swd.Finstack.Events;

public record EventEnvelope(
    string SpecVersion,
    string EventType,
    string EventVersion,
    Guid EventId,
    DateTimeOffset OccurredAt,
    string Producer,
    string TenantCode,
    object Data,
    Dictionary<string, string>? Meta = null
);

// Financial Event Types
public static class FinancialEventTypes
{
    public const string InvoiceCreated = "financial.invoice.created";
    public const string InvoiceUpdated = "financial.invoice.updated";
    public const string InvoicePaid = "financial.invoice.paid";
    public const string InvoiceOverdue = "financial.invoice.overdue";
    public const string PaymentCreated = "financial.payment.created";
    public const string PaymentCompleted = "financial.payment.completed";
    public const string PaymentFailed = "financial.payment.failed";
    public const string PaymentRefunded = "financial.payment.refunded";
    public const string CustomerCreated = "financial.customer.created";
    public const string CustomerUpdated = "financial.customer.updated";
    public const string LicenseIssued = "financial.license.issued";
    public const string LicenseExpired = "financial.license.expired";
    public const string AuditEvent = "financial.audit.event";
}

// Event Data Contracts
public record InvoiceCreatedEventData(
    Guid InvoiceId,
    string InvoiceNumber,
    Guid CustomerId,
    decimal Amount,
    string Currency,
    DateTimeOffset DueDate,
    string Status
);

public record InvoicePaidEventData(
    Guid InvoiceId,
    string InvoiceNumber,
    Guid CustomerId,
    decimal Amount,
    string Currency,
    DateTimeOffset PaidAt,
    Guid PaymentId
);

public record PaymentCompletedEventData(
    Guid PaymentId,
    Guid InvoiceId,
    Guid CustomerId,
    decimal Amount,
    string Currency,
    string PaymentMethod,
    DateTimeOffset CompletedAt
);

public record CustomerCreatedEventData(
    Guid CustomerId,
    string Name,
    string Email,
    string TenantCode,
    DateTimeOffset CreatedAt
);

public record LicenseIssuedEventData(
    Guid LicenseId,
    Guid CustomerId,
    Guid OrderId,
    string PlanCode,
    DateTimeOffset ExpiryDate,
    string SourceInvoiceNumber
);

public record AuditEventData(
    string OperationType,
    Guid EntityId,
    string EntityType,
    string UserId,
    string Details,
    DateTimeOffset Timestamp
);