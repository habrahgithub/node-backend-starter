using System.Text.Json.Nodes;

namespace Swd.Finstack.Governance;

public interface IGovernanceClient
{
    Task<bool> IsConnectedAsync(CancellationToken cancellationToken = default);
    Task<bool> RequestApprovalAsync(string changeType, JsonObject changeDetails, CancellationToken cancellationToken = default);
    Task<bool> CheckPolicyAsync(string policyType, JsonObject context, CancellationToken cancellationToken = default);
    Task<JsonObject> GetChangeControlStatusAsync(string changeId, CancellationToken cancellationToken = default);
    Task<bool> SubmitAuditRequestAsync(string auditType, JsonObject auditDetails, CancellationToken cancellationToken = default);
    Task<bool> ValidateComplianceAsync(string complianceType, JsonObject context, CancellationToken cancellationToken = default);
}