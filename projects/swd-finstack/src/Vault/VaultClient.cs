using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Logging;

namespace Swd.Finstack.Vault;

public class VaultClient : IVaultClient
{
    private readonly HttpClient _httpClient;
    private readonly string _vaultEndpoint;
    private readonly string _tenantCode;
    private readonly ILogger<VaultClient> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public VaultClient(
        HttpClient httpClient,
        string vaultEndpoint,
        string tenantCode,
        ILogger<VaultClient> logger)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _vaultEndpoint = vaultEndpoint ?? throw new ArgumentNullException(nameof(vaultEndpoint));
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
                $"{_vaultEndpoint}/health",
                cancellationToken);

            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to check Vault connection");
            return false;
        }
    }

    public async Task<JsonObject> GetConfigurationAsync(string key, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(key))
            throw new ArgumentException("Configuration key cannot be null or empty", nameof(key));

        try
        {
            var response = await _httpClient.GetAsync(
                $"{_vaultEndpoint}/config/{Uri.EscapeDataString(key)}",
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                    return null;

                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to get configuration from Vault. Key: {Key}, Status: {StatusCode}, Content: {Content}",
                    key, response.StatusCode, errorContent);
                
                throw new InvalidOperationException(
                    $"Failed to get configuration from Vault: {response.StatusCode} - {errorContent}");
            }

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var jsonObject = JsonSerializer.Deserialize<JsonObject>(content, _jsonOptions);

            _logger.LogInformation("Configuration retrieved from Vault: {Key}", key);
            return jsonObject;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting configuration from Vault: {Key}", key);
            throw;
        }
    }

    public async Task SetConfigurationAsync(string key, JsonObject value, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(key))
            throw new ArgumentException("Configuration key cannot be null or empty", nameof(key));
        if (value == null)
            throw new ArgumentNullException(nameof(value));

        try
        {
            var response = await _httpClient.PostAsJsonAsync(
                $"{_vaultEndpoint}/config/{Uri.EscapeDataString(key)}",
                value,
                _jsonOptions,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to set configuration in Vault. Key: {Key}, Status: {StatusCode}, Content: {Content}",
                    key, response.StatusCode, errorContent);
                
                throw new InvalidOperationException(
                    $"Failed to set configuration in Vault: {response.StatusCode} - {errorContent}");
            }

            _logger.LogInformation("Configuration set in Vault: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting configuration in Vault: {Key}", key);
            throw;
        }
    }

    public async Task<bool> DeleteConfigurationAsync(string key, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(key))
            throw new ArgumentException("Configuration key cannot be null or empty", nameof(key));

        try
        {
            var response = await _httpClient.DeleteAsync(
                $"{_vaultEndpoint}/config/{Uri.EscapeDataString(key)}",
                cancellationToken);

            if (!response.IsSuccessStatusCode && response.StatusCode != System.Net.HttpStatusCode.NotFound)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to delete configuration from Vault. Key: {Key}, Status: {StatusCode}, Content: {Content}",
                    key, response.StatusCode, errorContent);
                
                throw new InvalidOperationException(
                    $"Failed to delete configuration from Vault: {response.StatusCode} - {errorContent}");
            }

            _logger.LogInformation("Configuration deleted from Vault: {Key}", key);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting configuration from Vault: {Key}", key);
            throw;
        }
    }

    public async Task<JsonObject> GetAuditLogAsync(string entityId, string entityType, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(entityId))
            throw new ArgumentException("Entity ID cannot be null or empty", nameof(entityId));
        if (string.IsNullOrWhiteSpace(entityType))
            throw new ArgumentException("Entity type cannot be null or empty", nameof(entityType));

        try
        {
            var response = await _httpClient.GetAsync(
                $"{_vaultEndpoint}/audit/{entityType}/{Uri.EscapeDataString(entityId)}",
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                    return null;

                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to get audit log from Vault. Entity: {EntityType}/{EntityId}, Status: {StatusCode}, Content: {Content}",
                    entityType, entityId, response.StatusCode, errorContent);
                
                throw new InvalidOperationException(
                    $"Failed to get audit log from Vault: {response.StatusCode} - {errorContent}");
            }

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var jsonObject = JsonSerializer.Deserialize<JsonObject>(content, _jsonOptions);

            _logger.LogInformation("Audit log retrieved from Vault: {EntityType}/{EntityId}", entityType, entityId);
            return jsonObject;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audit log from Vault: {EntityType}/{EntityId}", entityType, entityId);
            throw;
        }
    }

    public async Task AppendAuditLogAsync(string entityId, string entityType, JsonObject auditEntry, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(entityId))
            throw new ArgumentException("Entity ID cannot be null or empty", nameof(entityId));
        if (string.IsNullOrWhiteSpace(entityType))
            throw new ArgumentException("Entity type cannot be null or empty", nameof(entityType));
        if (auditEntry == null)
            throw new ArgumentNullException(nameof(auditEntry));

        try
        {
            var response = await _httpClient.PostAsJsonAsync(
                $"{_vaultEndpoint}/audit/{entityType}/{Uri.EscapeDataString(entityId)}",
                auditEntry,
                _jsonOptions,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to append audit log to Vault. Entity: {EntityType}/{EntityId}, Status: {StatusCode}, Content: {Content}",
                    entityType, entityId, response.StatusCode, errorContent);
                
                throw new InvalidOperationException(
                    $"Failed to append audit log to Vault: {response.StatusCode} - {errorContent}");
            }

            _logger.LogInformation("Audit log appended to Vault: {EntityType}/{EntityId}", entityType, entityId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error appending audit log to Vault: {EntityType}/{EntityId}", entityType, entityId);
            throw;
        }
    }

    public async Task<JsonObject> GetLicenseMappingAsync(Guid licenseId, CancellationToken cancellationToken = default)
    {
        if (licenseId == Guid.Empty)
            throw new ArgumentException("License ID cannot be empty", nameof(licenseId));

        try
        {
            var response = await _httpClient.GetAsync(
                $"{_vaultEndpoint}/mappings/licenses/{licenseId}",
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                    return null;

                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to get license mapping from Vault. License ID: {LicenseId}, Status: {StatusCode}, Content: {Content}",
                    licenseId, response.StatusCode, errorContent);
                
                throw new InvalidOperationException(
                    $"Failed to get license mapping from Vault: {response.StatusCode} - {errorContent}");
            }

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var jsonObject = JsonSerializer.Deserialize<JsonObject>(content, _jsonOptions);

            _logger.LogInformation("License mapping retrieved from Vault: {LicenseId}", licenseId);
            return jsonObject;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting license mapping from Vault: {LicenseId}", licenseId);
            throw;
        }
    }

    public async Task SetLicenseMappingAsync(Guid licenseId, JsonObject mapping, CancellationToken cancellationToken = default)
    {
        if (licenseId == Guid.Empty)
            throw new ArgumentException("License ID cannot be empty", nameof(licenseId));
        if (mapping == null)
            throw new ArgumentNullException(nameof(mapping));

        try
        {
            var response = await _httpClient.PostAsJsonAsync(
                $"{_vaultEndpoint}/mappings/licenses/{licenseId}",
                mapping,
                _jsonOptions,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to set license mapping in Vault. License ID: {LicenseId}, Status: {StatusCode}, Content: {Content}",
                    licenseId, response.StatusCode, errorContent);
                
                throw new InvalidOperationException(
                    $"Failed to set license mapping in Vault: {response.StatusCode} - {errorContent}");
            }

            _logger.LogInformation("License mapping set in Vault: {LicenseId}", licenseId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting license mapping in Vault: {LicenseId}", licenseId);
            throw;
        }
    }

    public async Task<JsonObject> GetIntegrationCredentialsAsync(string service, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(service))
            throw new ArgumentException("Service name cannot be null or empty", nameof(service));

        try
        {
            var response = await _httpClient.GetAsync(
                $"{_vaultEndpoint}/credentials/{Uri.EscapeDataString(service)}",
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                    return null;

                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to get integration credentials from Vault. Service: {Service}, Status: {StatusCode}, Content: {Content}",
                    service, response.StatusCode, errorContent);
                
                throw new InvalidOperationException(
                    $"Failed to get integration credentials from Vault: {response.StatusCode} - {errorContent}");
            }

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var jsonObject = JsonSerializer.Deserialize<JsonObject>(content, _jsonOptions);

            _logger.LogInformation("Integration credentials retrieved from Vault: {Service}", service);
            return jsonObject;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting integration credentials from Vault: {Service}", service);
            throw;
        }
    }

    public async Task SetIntegrationCredentialsAsync(string service, JsonObject credentials, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(service))
            throw new ArgumentException("Service name cannot be null or empty", nameof(service));
        if (credentials == null)
            throw new ArgumentNullException(nameof(credentials));

        try
        {
            var response = await _httpClient.PostAsJsonAsync(
                $"{_vaultEndpoint}/credentials/{Uri.EscapeDataString(service)}",
                credentials,
                _jsonOptions,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to set integration credentials in Vault. Service: {Service}, Status: {StatusCode}, Content: {Content}",
                    service, response.StatusCode, errorContent);
                
                throw new InvalidOperationException(
                    $"Failed to set integration credentials in Vault: {response.StatusCode} - {errorContent}");
            }

            _logger.LogInformation("Integration credentials set in Vault: {Service}", service);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting integration credentials in Vault: {Service}", service);
            throw;
        }
    }
}