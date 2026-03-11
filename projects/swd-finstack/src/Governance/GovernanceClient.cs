using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Logging;

namespace Swd.Finstack.Governance;

public class GovernanceClient : IGovernanceClient
{
    private readonly HttpClient _httpClient;
    private readonly string _governanceEndpoint;
    private readonly string _tenantCode;
    private readonly ILogger<GovernanceClient> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public GovernanceClient(
        HttpClient httpClient,
        string governanceEndpoint,
        string tenantCode,
        ILogger<GovernanceClient> logger)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _governanceEndpoint = governanceEndpoint ?? throw new ArgumentNullException(nameof(governanceEndpoint));
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
                $"{_governanceEndpoint}/health",
                cancellationToken);

            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to check Governance connection");
            return false;
        }
    }

    public async Task<bool> RequestApprovalAsync(string changeType, JsonObject changeDetails, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(changeType))
            throw new ArgumentException("Change type cannot be null or empty", nameof(changeType));
        if (changeDetails == null)
            throw new ArgumentNullException(nameof(changeDetails));

        try
        {
            var request = new JsonObject
            {
                ["changeType"] = changeType,
                ["changeDetails"] = changeDetails,
                ["tenantCode"] = _tenantCode,
                ["timestamp"] = DateTimeOffset.UtcNow.ToString("o")
            };

            var response = await _httpClient.PostAsJsonAsync(
                $"{_governanceEndpoint}/approvals/request",
                request,
                _jsonOptions,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to request approval from Governance. Change Type: {ChangeType}, Status: {StatusCode}, Content: {Content}",
                    changeType, response.StatusCode, errorContent);
                
                throw new InvalidOperationException(
                    $"Failed to request approval from Governance: {response.StatusCode} - {errorContent}");
            }

            var result = await response.Content.ReadFromJsonAsync<JsonObject>(_jsonOptions, cancellationToken);
            var approved = result?["approved"]?.GetValue<bool>() ?? false;

            _logger.LogInformation(
                "Approval request processed. Change Type: {ChangeType}, Approved: {Approved}",
                changeType, approved);

            return approved;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error requesting approval from Governance: {ChangeType}", changeType);
            throw;
        }
    }

    public async Task<bool> CheckPolicyAsync(string policyType, JsonObject context, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(policyType))
            throw new ArgumentException("Policy type cannot be null or empty", nameof(policyType));
        if (context == null)
            throw new ArgumentNullException(nameof(context));

        try
        {
            var request = new JsonObject
            {
                ["policyType"] = policyType,
                ["context"] = context,
                ["tenantCode"] = _tenantCode,
                ["timestamp"] = DateTimeOffset.UtcNow.ToString("o")
            };

            var response = await _httpClient.PostAsJsonAsync(
                $"{_governanceEndpoint}/policies/check",
                request,
                _jsonOptions,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to check policy with Governance. Policy Type: {PolicyType}, Status: {StatusCode}, Content: {Content}",
                    policyType, response.StatusCode, errorContent);
                
                throw new InvalidOperationException(
                    $"Failed to check policy with Governance: {response.StatusCode} - {errorContent}");
            }

            var result = await response.Content.ReadFromJsonAsync<JsonObject>(_jsonOptions, cancellationToken);
            var compliant = result?["compliant"]?.GetValue<bool>() ?? false;

            _logger.LogInformation(
                "Policy check completed. Policy Type: {PolicyType}, Compliant: {Compliant}",
                policyType, compliant);

            return compliant;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking policy with Governance: {PolicyType}", policyType);
            throw;
        }
    }

    public async Task<JsonObject> GetChangeControlStatusAsync(string changeId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(changeId))
            throw new ArgumentException("Change ID cannot be null or empty", nameof(changeId));

        try
        {
            var response = await _httpClient.GetAsync(
                $"{_governanceEndpoint}/changes/{Uri.EscapeDataString(changeId)}",
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                    return null;

                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to get change control status from Governance. Change ID: {ChangeId}, Status: {StatusCode}, Content: {Content}",
                    changeId, response.StatusCode, errorContent);
                
                throw new InvalidOperationException(
                    $"Failed to get change control status from Governance: {response.StatusCode} - {errorContent}");
            }

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var jsonObject = JsonSerializer.Deserialize<JsonObject>(content, _jsonOptions);

            _logger.LogInformation("Change control status retrieved from Governance: {ChangeId}", changeId);
            return jsonObject;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting change control status from Governance: {ChangeId}", changeId);
            throw;
        }
    }

    public async Task<bool> SubmitAuditRequestAsync(string auditType, JsonObject auditDetails, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(auditType))
            throw new ArgumentException("Audit type cannot be null or empty", nameof(auditType));
        if (auditDetails == null)
            throw new ArgumentNullException(nameof(auditDetails));

        try
        {
            var request = new JsonObject
            {
                ["auditType"] = auditType,
                ["auditDetails"] = auditDetails,
                ["tenantCode"] = _tenantCode,
                ["timestamp"] = DateTimeOffset.UtcNow.ToString("o")
            };

            var response = await _httpClient.PostAsJsonAsync(
                $"{_governanceEndpoint}/audits/submit",
                request,
                _jsonOptions,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to submit audit request to Governance. Audit Type: {AuditType}, Status: {StatusCode}, Content: {Content}",
                    auditType, response.StatusCode, errorContent);
                
                throw new InvalidOperationException(
                    $"Failed to submit audit request to Governance: {response.StatusCode} - {errorContent}");
            }

            var result = await response.Content.ReadFromJsonAsync<JsonObject>(_jsonOptions, cancellationToken);
            var accepted = result?["accepted"]?.GetValue<bool>() ?? false;

            _logger.LogInformation(
                "Audit request submitted to Governance. Audit Type: {AuditType}, Accepted: {Accepted}",
                auditType, accepted);

            return accepted;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting audit request to Governance: {AuditType}", auditType);
            throw;
        }
    }

    public async Task<bool> ValidateComplianceAsync(string complianceType, JsonObject context, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(complianceType))
            throw new ArgumentException("Compliance type cannot be null or empty", nameof(complianceType));
        if (context == null)
            throw new ArgumentNullException(nameof(context));

        try
        {
            var request = new JsonObject
            {
                ["complianceType"] = complianceType,
                ["context"] = context,
                ["tenantCode"] = _tenantCode,
                ["timestamp"] = DateTimeOffset.UtcNow.ToString("o")
            };

            var response = await _httpClient.PostAsJsonAsync(
                $"{_governanceEndpoint}/compliance/validate",
                request,
                _jsonOptions,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Failed to validate compliance with Governance. Compliance Type: {ComplianceType}, Status: {StatusCode}, Content: {Content}",
                    complianceType, response.StatusCode, errorContent);
                
                throw new InvalidOperationException(
                    $"Failed to validate compliance with Governance: {response.StatusCode} - {errorContent}");
            }

            var result = await response.Content.ReadFromJsonAsync<JsonObject>(_jsonOptions, cancellationToken);
            var compliant = result?["compliant"]?.GetValue<bool>() ?? false;

            _logger.LogInformation(
                "Compliance validation completed. Compliance Type: {ComplianceType}, Compliant: {Compliant}",
                complianceType, compliant);

            return compliant;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating compliance with Governance: {ComplianceType}", complianceType);
            throw;
        }
    }
}