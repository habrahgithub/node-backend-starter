using System.Text.Json.Nodes;

namespace Swd.Finstack.Vault;

public interface IVaultClient
{
    Task<bool> IsConnectedAsync(CancellationToken cancellationToken = default);
    Task<JsonObject> GetConfigurationAsync(string key, CancellationToken cancellationToken = default);
    Task SetConfigurationAsync(string key, JsonObject value, CancellationToken cancellationToken = default);
    Task<bool> DeleteConfigurationAsync(string key, CancellationToken cancellationToken = default);
    Task<JsonObject> GetAuditLogAsync(string entityId, string entityType, CancellationToken cancellationToken = default);
    Task AppendAuditLogAsync(string entityId, string entityType, JsonObject auditEntry, CancellationToken cancellationToken = default);
    Task<JsonObject> GetLicenseMappingAsync(Guid licenseId, CancellationToken cancellationToken = default);
    Task SetLicenseMappingAsync(Guid licenseId, JsonObject mapping, CancellationToken cancellationToken = default);
    Task<JsonObject> GetIntegrationCredentialsAsync(string service, CancellationToken cancellationToken = default);
    Task SetIntegrationCredentialsAsync(string service, JsonObject credentials, CancellationToken cancellationToken = default);
}