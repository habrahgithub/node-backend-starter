using DocSmith.Pulse.Data;
using DocSmith.Pulse.Models;
using DocSmith.Pulse.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace DocSmith.Pulse.Pages;

public class IdeasModel : PageModel
{
    private readonly AppDbContext _db;
    private readonly IDraftGenerator _generator;

    public IdeasModel(AppDbContext db, IDraftGenerator generator)
    {
        _db = db;
        _generator = generator;
    }

    public List<PostIdea> Ideas { get; set; } = new();

    [BindProperty]
    public IdeaInput Input { get; set; } = new();

    public class IdeaInput
    {
        public string Topic { get; set; } = "";
        public string Persona { get; set; } = "SME Founder";
        public string PostType { get; set; } = "Tip";
        public string KeyPoint { get; set; } = "";
        public string CtaStyle { get; set; } = "None";
    }

    public async Task OnGetAsync()
    {
        Ideas = await _db.PostIdeas
            .OrderByDescending(x => x.Id)
            .Take(50)
            .ToListAsync();
    }

    public async Task<IActionResult> OnPostAddAsync()
    {
        if (string.IsNullOrWhiteSpace(Input.Topic))
        {
            return RedirectToPage();
        }

        var idea = new PostIdea
        {
            Topic = Input.Topic.Trim(),
            Persona = string.IsNullOrWhiteSpace(Input.Persona) ? "SME Founder" : Input.Persona.Trim(),
            PostType = string.IsNullOrWhiteSpace(Input.PostType) ? "Tip" : Input.PostType.Trim(),
            KeyPoint = Input.KeyPoint?.Trim() ?? "",
            CtaStyle = string.IsNullOrWhiteSpace(Input.CtaStyle) ? "None" : Input.CtaStyle.Trim(),
            Status = "Idea"
        };

        _db.PostIdeas.Add(idea);
        await _db.SaveChangesAsync();

        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostGenerateAsync(int id)
    {
        var idea = await _db.PostIdeas.FirstOrDefaultAsync(x => x.Id == id);
        if (idea == null)
        {
            return RedirectToPage();
        }

        var existing = await _db.PostDrafts.Where(d => d.PostIdeaId == id).ToListAsync();
        if (existing.Count > 0)
        {
            _db.PostDrafts.RemoveRange(existing);
        }

        for (var variant = 1; variant <= 3; variant++)
        {
            var (draft, hashtags) = await _generator.GeneratePostAsync(idea, variant);
            _db.PostDrafts.Add(new PostDraft
            {
                PostIdeaId = idea.Id,
                VariantNo = variant,
                DraftText = draft,
                Hashtags = hashtags,
                IsApproved = false
            });
        }

        idea.Status = "Drafted";
        await _db.SaveChangesAsync();

        return RedirectToPage("/Drafts", new { id });
    }
}
