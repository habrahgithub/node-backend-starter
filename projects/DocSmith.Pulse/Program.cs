using DocSmith.Pulse.Data;
using DocSmith.Pulse.Options;
using DocSmith.Pulse.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorPages();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.Configure<PulseOptions>(builder.Configuration.GetSection(PulseOptions.SectionName));

builder.Services.AddScoped<TemplateDraftGenerator>();
builder.Services.AddHttpClient<OpenAiDraftGenerator>();
builder.Services.AddScoped<IDraftGenerator>(sp =>
{
    var options = sp.GetRequiredService<IOptions<PulseOptions>>().Value;
    var logger = sp.GetRequiredService<ILoggerFactory>().CreateLogger("DraftGeneratorSelector");

    if (string.Equals(options.GeneratorMode, "OpenAI", StringComparison.OrdinalIgnoreCase))
    {
        if (string.IsNullOrWhiteSpace(options.OpenAI.ApiKey))
        {
            logger.LogWarning("Pulse:GeneratorMode is OpenAI but Pulse:OpenAI:ApiKey is empty. Falling back to template mode.");
            return sp.GetRequiredService<TemplateDraftGenerator>();
        }

        return sp.GetRequiredService<OpenAiDraftGenerator>();
    }

    return sp.GetRequiredService<TemplateDraftGenerator>();
});

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();
app.UseAuthorization();

app.MapRazorPages();

app.Run();
