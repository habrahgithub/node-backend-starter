# SWD-FINSTACK Integration Guide

This guide documents the integration of SWD-FINSTACK with the SWD-ARC control plane.

## Overview

SWD-FINSTACK is now fully integrated with SWD-ARC, providing:

- **MCP Server Integration** - Financial management tools accessible via MCP
- **Event Publishing** - Real-time event streaming to SWD-ARC Synapse
- **Vault Integration** - Secure storage of financial data and configurations
- **Governance Integration** - Policy enforcement and approval workflows
- **Control Center Integration** - Financial dashboards and monitoring

## Architecture

```
SWD-FINSTACK (.NET 8)
├── MCP Server (Node.js)
├── Events (Event Bus)
├── Vault (Data Storage)
├── Governance (Policy & Approvals)
└── Control Center (Dashboards)
    ↓
SWD-ARC Control Plane
├── Controls Center (UI)
├── MCP Server (Gateway)
├── Vault (Source of Truth)
├── Governance (Policy Authority)
└── Synapse (Event Bus)
```

## Components

### 1. MCP Server Integration

**Location**: `/mcp/server/`

**Purpose**: Provides financial management tools accessible via MCP protocol

**Tools Available**:
- `financial_health_check` - Comprehensive health check
- `get_invoice_status` - Invoice status queries
- `list_invoices` - Invoice listing with filtering
- `get_payment_status` - Payment status queries
- `list_payments` - Payment listing with filtering
- `get_customer_info` - Customer information
- `get_license_status` - License status queries
- `get_audit_trail` - Audit trail access
- `get_financial_metrics` - Financial KPIs

**Configuration**:
```bash
# Environment variables
FINSTACK_API_URL=http://localhost:5000
FINSTACK_API_KEY=swd-finstack-key
```

### 2. Event Publishing

**Location**: `/src/Events/`

**Purpose**: Publish financial events to SWD-ARC Synapse event bus

**Event Types**:
- `financial.invoice.created`
- `financial.invoice.paid`
- `financial.payment.completed`
- `financial.customer.created`
- `financial.license.issued`
- `financial.audit.event`

**Usage**:
```csharp
var publisher = serviceProvider.GetService<IEventPublisher>();
var @event = new EventEnvelope(
    SpecVersion: "1.0",
    EventType: FinancialEventTypes.InvoicePaid,
    EventVersion: "1",
    EventId: Guid.NewGuid(),
    OccurredAt: DateTimeOffset.UtcNow,
    Producer: "swd-finstack",
    TenantCode: "swd",
    Data: new InvoicePaidEventData(...)
);

await publisher.PublishAsync(@event);
```

### 3. Vault Integration

**Location**: `/src/Vault/`

**Purpose**: Secure storage of financial configurations, audit logs, and license mappings

**Features**:
- Configuration storage and retrieval
- Audit log management
- License mapping storage
- Integration credentials management

**Usage**:
```csharp
var vaultClient = serviceProvider.GetService<IVaultClient>();

// Store configuration
var config = JsonSerializer.SerializeToNode(new { 
    PaymentGateway = "stripe",
    LicenseEndpoint = "https://licensing.example.com"
});
await vaultClient.SetConfigurationAsync("financial-config", config);

// Retrieve audit log
var auditLog = await vaultClient.GetAuditLogAsync("invoice-123", "invoice");
```

### 4. Governance Integration

**Location**: `/src/Governance/`

**Purpose**: Policy enforcement and approval workflows for financial operations

**Features**:
- Change approval requests
- Policy compliance checking
- Audit request submission
- Compliance validation

**Usage**:
```csharp
var governanceClient = serviceProvider.GetService<IGovernanceClient>();

// Request approval for large payment
var approvalRequest = JsonSerializer.SerializeToNode(new {
    Amount = 50000m,
    Currency = "USD",
    Reason = "Large vendor payment"
});

var approved = await governanceClient.RequestApprovalAsync(
    "large-payment", approvalRequest);

if (!approved)
{
    throw new InvalidOperationException("Payment requires manual approval");
}
```

### 5. Control Center Integration

**Location**: `/src/ControlCenter/`

**Purpose**: Financial dashboards and real-time monitoring in SWD-ARC Control Center

**Features**:
- Dashboard registration
- Metrics updates
- Alert sending
- Status updates
- Widget management

**Usage**:
```csharp
var controlCenterClient = serviceProvider.GetService<IControlCenterClient>();

// Register financial dashboard
var dashboardConfig = JsonSerializer.SerializeToNode(new {
    Title = "Financial Overview",
    Widgets = new[] { "revenue", "invoices", "payments" }
});

await controlCenterClient.RegisterDashboardAsync("financial-overview", dashboardConfig);

// Update metrics
var metrics = JsonSerializer.SerializeToNode(new {
    Revenue = 150000m,
    InvoicesOutstanding = 25,
    PaymentSuccessRate = 98.5
});

await controlCenterClient.UpdateMetricsAsync("financial-overview", metrics);
```

## Configuration

### Environment Variables

```bash
# MCP Server
FINSTACK_API_URL=http://localhost:5000
FINSTACK_API_KEY=your-api-key

# Event Publishing
SYNAPSE_ENDPOINT=http://localhost:3000/synapse

# Vault Integration
VAULT_ENDPOINT=http://localhost:3000/vault

# Governance Integration
GOVERNANCE_ENDPOINT=http://localhost:3000/governance

# Control Center Integration
CONTROL_CENTER_ENDPOINT=http://localhost:4010/api
```

### Service Registration

```csharp
// In Program.cs or Startup.cs
builder.Services.AddSingleton<IEventPublisher, SynapseEventPublisher>();
builder.Services.AddSingleton<IVaultClient, VaultClient>();
builder.Services.AddSingleton<IGovernanceClient, GovernanceClient>();
builder.Services.AddSingleton<IControlCenterClient, ControlCenterClient>();

// Configure clients
builder.Services.Configure<SynapseEventPublisherOptions>(options => {
    options.SynapseEndpoint = builder.Configuration["SYNAPSE_ENDPOINT"];
    options.TenantCode = "swd";
});

builder.Services.Configure<VaultClientOptions>(options => {
    options.VaultEndpoint = builder.Configuration["VAULT_ENDPOINT"];
    options.TenantCode = "swd";
});
```

## Deployment

### 1. Register SWD-FINSTACK in ARC Registry

SWD-FINSTACK is already registered in `/projects/SWD-ARC/registry/modules.json`:

```json
{
  "key": "finstack",
  "name": "SWD Finstack",
  "boundary": "financial",
  "path": "../swd-finstack",
  "runTarget": "swd-finstack",
  "role": "financial_management",
  "critical": true
}
```

### 2. Start Services

```bash
# Start SWD-ARC Control Center
cd /home/habib/workspace/projects/SWD-ARC/apps/controls-center
npm run dev

# Start SWD-ARC MCP Server
cd /home/habib/workspace/projects/SWD-ARC/mcp/server
npm start

# Start SWD-FINSTACK MCP Server
cd /home/habib/workspace/projects/swd-finstack/mcp/server
npm start

# Start SWD-FINSTACK API
cd /home/habib/workspace/projects/swd-finstack/src/Host/Swd.Finstack.Api
dotnet run
```

### 3. Verify Integration

```bash
# Check MCP server connectivity
curl http://localhost:3000/health

# Check event publishing
curl http://localhost:3000/synapse/health

# Check vault connectivity
curl http://localhost:3000/vault/health

# Check governance connectivity
curl http://localhost:3000/governance/health

# Check control center
curl http://localhost:4010/api/health
```

## Monitoring

### Health Checks

Each integration component provides health check endpoints:

- **MCP Server**: `http://localhost:3000/health`
- **Event Publisher**: `http://localhost:3000/synapse/health`
- **Vault Client**: `http://localhost:3000/vault/health`
- **Governance Client**: `http://localhost:3000/governance/health`
- **Control Center**: `http://localhost:4010/api/health`

### Metrics

Financial metrics are automatically published to the Control Center dashboard:

- Revenue metrics
- Invoice status
- Payment processing
- License utilization
- Audit compliance

### Alerts

The system automatically sends alerts for:

- Payment failures
- Invoice overdue status
- License expiration
- Compliance violations
- System health issues

## Troubleshooting

### Common Issues

1. **MCP Server Connection Failed**
   - Check `FINSTACK_API_URL` and `FINSTACK_API_KEY` environment variables
   - Verify SWD-FINSTACK API is running
   - Check network connectivity

2. **Event Publishing Failed**
   - Verify Synapse endpoint is correct
   - Check SWD-ARC MCP server is running
   - Review event envelope format

3. **Vault Operations Failed**
   - Verify Vault endpoint is correct
   - Check authentication credentials
   - Ensure proper permissions

4. **Governance Requests Failed**
   - Verify governance endpoint is correct
   - Check policy definitions
   - Review approval workflows

5. **Control Center Updates Failed**
   - Verify Control Center endpoint is correct
   - Check dashboard registration
   - Review widget configurations

### Logs

Integration logs are available in:

- **MCP Server**: `swd-finstack-mcp.log`
- **Application**: Standard .NET logging
- **Event Publisher**: Console and file logs
- **Vault Client**: Console and file logs
- **Governance Client**: Console and file logs
- **Control Center**: Console and file logs

## Security

### Authentication

- All integrations use API keys for authentication
- HTTPS is recommended for production deployments
- Token-based authentication for sensitive operations

### Data Protection

- Financial data is encrypted in transit
- Vault provides secure storage for sensitive information
- Audit trails maintain data integrity

### Access Control

- Role-based access control for all integrations
- Approval workflows for critical financial operations
- Audit logging for all sensitive operations

## Future Enhancements

### Planned Features

1. **Microservices Migration**
   - Extract modules to separate services
   - Implement service mesh for communication
   - Add circuit breakers and retries

2. **Advanced Analytics**
   - Machine learning for fraud detection
   - Predictive analytics for revenue forecasting
   - Advanced dashboard widgets

3. **Multi-Tenant Support**
   - Enhanced tenant isolation
   - Cross-tenant reporting
   - Tenant-specific configurations

4. **Integration Extensions**
   - Additional payment gateway integrations
   - Accounting software integration
   - Tax calculation services

## Support

For support and questions:

1. Check the troubleshooting section above
2. Review integration logs
3. Verify configuration settings
4. Contact the SWD development team

## Version History

- **v1.0.0** - Initial integration with SWD-ARC
  - MCP server integration
  - Event publishing to Synapse
  - Vault integration for data storage
  - Governance integration for approvals
  - Control Center integration for dashboards