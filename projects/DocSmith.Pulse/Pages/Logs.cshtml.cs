using DocSmith.Pulse.Data;
using DocSmith.Pulse.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace DocSmith.Pulse.Pages;

public class LogsModel : PageModel
{
    private readonly AppDbContext _db;

    public LogsModel(AppDbContext db)
    {
        _db = db;
    }

    public List<ActivityLog> Logs { get; set; } = new();

    public async Task OnGetAsync()
    {
        Logs = await _db.ActivityLogs
            .OrderByDescending(l => l.ActivityAtUtc)
            .Take(200)
            .ToListAsync();
    }

    public async Task<IActionResult> OnPostUpdateMetricsAsync(int id, int? impressions, int? reactions, int? comments, int? clicks)
    {
        var log = await _db.ActivityLogs.FirstOrDefaultAsync(x => x.Id == id);
        if (log == null)
        {
            return RedirectToPage();
        }

        log.Impressions = impressions;
        log.Reactions = reactions;
        log.Comments = comments;
        log.Clicks = clicks;

        await _db.SaveChangesAsync();

        return RedirectToPage();
    }
}
