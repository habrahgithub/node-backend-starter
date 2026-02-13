using DocSmith.LinkedInBot.Data;
using DocSmith.LinkedInBot.Models;
using DocSmith.LinkedInBot.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace DocSmith.LinkedInBot.Pages;

public class IdeasModel : PageModel
{
    private readonly AppDbContext _db;
    private readonly IDraftGenerator _gen;

    public IdeasModel(AppDbContext db, IDraftGenerator gen)
    {
        _db = db;
        _gen = gen;
    }

    public List<PostIdea> Ideas { get; set; } = new();

    public async Task OnGetAsync()
    {
        Ideas = await _db.PostIdeas
            .OrderByDescending(x => x.Id)
            .Take(50)
            .ToListAsync();
    }

    public async Task<IActionResult> OnPostAddAsync(string topic, string persona, string postType, string keyPoint)
    {
        if (string.IsNullOrWhiteSpace(topic))
            return RedirectToPage();

        _db.PostIdeas.Add(new PostIdea
        {
            Topic = topic.Trim(),
            Persona = string.IsNullOrWhiteSpace(persona) ? "SME Founder" : persona.Trim(),
            PostType = string.IsNullOrWhiteSpace(postType) ? "Tip" : postType.Trim(),
            KeyPoint = keyPoint?.Trim() ?? ""
        });

        await _db.SaveChangesAsync();
        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostGenerateAsync(int id)
    {
        var idea = await _db.PostIdeas.FirstOrDefaultAsync(x => x.Id == id);
        if (idea == null) return RedirectToPage();

        // Remove old drafts for clean regeneration
        var old = await _db.PostDrafts.Where(d => d.PostIdeaId == id).ToListAsync();
        _db.PostDrafts.RemoveRange(old);

        for (int v = 1; v <= 3; v++)
        {
            var (draft, hashtags) = await _gen.GeneratePostAsync(idea, v);
            _db.PostDrafts.Add(new PostDraft
            {
                PostIdeaId = idea.Id,
                VariantNo = v,
                DraftText = draft,
                Hashtags = hashtags
            });
        }

        idea.Status = "Drafted";
        await _db.SaveChangesAsync();

        return Redirect($"/Drafts?id={id}");
    }
}
