using DocSmith.Pulse.Data;
using DocSmith.Pulse.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace DocSmith.Pulse.Pages;

public class DraftsModel : PageModel
{
    private readonly AppDbContext _db;

    public DraftsModel(AppDbContext db)
    {
        _db = db;
    }

    public PostIdea? Idea { get; set; }
    public List<PostDraft> Drafts { get; set; } = new();

    public async Task OnGetAsync(int id)
    {
        Idea = await _db.PostIdeas.FirstOrDefaultAsync(x => x.Id == id);
        if (Idea == null)
        {
            return;
        }

        Drafts = await _db.PostDrafts
            .Where(d => d.PostIdeaId == id)
            .OrderBy(d => d.VariantNo)
            .ToListAsync();
    }

    public async Task<IActionResult> OnPostApproveAsync(int draftId)
    {
        var draft = await _db.PostDrafts
            .Include(d => d.PostIdea)
            .FirstOrDefaultAsync(d => d.Id == draftId);

        if (draft == null)
        {
            return RedirectToPage("/Ideas");
        }

        var siblings = await _db.PostDrafts
            .Where(d => d.PostIdeaId == draft.PostIdeaId)
            .ToListAsync();

        foreach (var sibling in siblings)
        {
            sibling.IsApproved = false;
            sibling.ApprovedAtUtc = null;
        }

        draft.IsApproved = true;
        draft.ApprovedAtUtc = DateTime.UtcNow;

        if (draft.PostIdea != null)
        {
            draft.PostIdea.Status = "Approved";
        }

        await _db.SaveChangesAsync();

        return RedirectToPage(new { id = draft.PostIdeaId });
    }
}
