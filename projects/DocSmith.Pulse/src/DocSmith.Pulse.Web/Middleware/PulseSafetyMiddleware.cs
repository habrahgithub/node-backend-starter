using DocSmith.Pulse.Core.Abstractions;
using DocSmith.Pulse.Core.Entities;
using DocSmith.Pulse.Web.Attributes;

namespace DocSmith.Pulse.Web.Middleware;

public class PulseSafetyMiddleware
{
    private static readonly HashSet<string> ProtectedHandlers = new(StringComparer.OrdinalIgnoreCase)
    {
        "Generate",
        "GeneratePack",
        "SearchMedia",
        "GenerateImage",
        "GenerateVideo",
        "GenerateDiagram",
        "Queue",
        "Approve",
        "Schedule",
        "Export",
        "MarkPosted",
        "MarkCommentUsed"
    };

    private readonly RequestDelegate _next;

    public PulseSafetyMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ISafetyService safetyService, IAuditLogService auditLogService)
    {
        var path = context.Request.Path.Value ?? string.Empty;

        if (path.StartsWith("/Admin/Safety", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        if (!HttpMethods.IsPost(context.Request.Method))
        {
            await _next(context);
            return;
        }

        var endpoint = context.GetEndpoint();
        var hasSafetyMetadata = endpoint?.Metadata.GetMetadata<RequiresPulseEnabledAttribute>() != null;
        var handler = context.Request.Query["handler"].ToString();
        var isProtectedHandler = ProtectedHandlers.Contains(handler);

        if (!hasSafetyMetadata && !isProtectedHandler)
        {
            await _next(context);
            return;
        }

        var state = await safetyService.GetStateAsync(context.RequestAborted);

        if (safetyService.IsKillSwitchEffective(state))
        {
            await auditLogService.LogAsync(
                action: "PulseActionBlocked",
                entityType: "SafetyState",
                entityId: SafetyState.SingletonId.ToString(),
                inputSummary: $"Path={path}; Handler={handler}",
                sourcePath: path,
                wasBlocked: true,
                reason: "KillSwitch");

            context.Response.Redirect(WithBlockedQuery(path, "killswitch"));
            return;
        }

        if (state.OrganizationSafeModeEnabled)
        {
            if (string.Equals(handler, "Schedule", StringComparison.OrdinalIgnoreCase) && !state.SchedulerEnabled)
            {
                await BlockForStateAsync(context, auditLogService, path, handler, "SchedulerDisabledBySafetyState");
                return;
            }

            if (string.Equals(handler, "Export", StringComparison.OrdinalIgnoreCase) && !state.ExportsEnabled)
            {
                await BlockForStateAsync(context, auditLogService, path, handler, "ExportsDisabledBySafetyState");
                return;
            }
        }

        await _next(context);
    }

    private static async Task BlockForStateAsync(
        HttpContext context,
        IAuditLogService auditLogService,
        string path,
        string handler,
        string reason)
    {
        await auditLogService.LogAsync(
            action: "PulseActionBlocked",
            entityType: "SafetyState",
            entityId: SafetyState.SingletonId.ToString(),
            inputSummary: $"Path={path}; Handler={handler}",
            sourcePath: path,
            wasBlocked: true,
            reason: reason);

        context.Response.Redirect(WithBlockedQuery(path, "safemode"));
    }

    private static string WithBlockedQuery(string path, string reason)
    {
        return path.Contains('?', StringComparison.Ordinal)
            ? $"{path}&blocked={reason}"
            : $"{path}?blocked={reason}";
    }
}
