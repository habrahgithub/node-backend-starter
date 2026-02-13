using DocSmith.Pulse.Core.Abstractions;
using DocSmith.Pulse.Core.Configuration;
using DocSmith.Pulse.Infrastructure.Data;
using DocSmith.Pulse.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DocSmith.Pulse.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddPulseInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<PulseDbContext>(options =>
            options.UseSqlite(configuration.GetConnectionString("DefaultConnection")));

        services.Configure<PulseOptions>(configuration.GetSection(PulseOptions.SectionName));

        services.AddScoped<ISafetyService, SafetyService>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddHttpClient<IInternetMediaSearchService, OpenverseMediaSearchService>();
        services.AddHttpClient<ICreativeStudioService, CreativeStudioService>();

        services.AddScoped<TemplateDraftGenerator>();
        services.AddHttpClient<OpenAiDraftGenerator>();
        services.AddScoped<IDraftGenerator>(sp =>
        {
            var options = sp.GetRequiredService<IOptions<PulseOptions>>().Value;
            var logger = sp.GetRequiredService<ILoggerFactory>().CreateLogger("DraftGeneratorSelector");

            if (string.Equals(options.GeneratorMode, "OpenAI", StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrWhiteSpace(options.OpenAI.ApiKey))
                {
                    logger.LogWarning("OpenAI mode requested but API key is empty. Falling back to Template mode.");
                    return sp.GetRequiredService<TemplateDraftGenerator>();
                }

                return sp.GetRequiredService<OpenAiDraftGenerator>();
            }

            return sp.GetRequiredService<TemplateDraftGenerator>();
        });

        return services;
    }
}
