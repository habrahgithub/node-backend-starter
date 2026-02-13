using DocSmith.LinkedInBot.Models;
using Microsoft.EntityFrameworkCore;

namespace DocSmith.LinkedInBot.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<PostIdea> PostIdeas => Set<PostIdea>();
    public DbSet<PostDraft> PostDrafts => Set<PostDraft>();
    public DbSet<EngagementTarget> EngagementTargets => Set<EngagementTarget>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PostDraft>()
            .HasOne(d => d.PostIdea)
            .WithMany()
            .HasForeignKey(d => d.PostIdeaId)
            .OnDelete(DeleteBehavior.Cascade);

        base.OnModelCreating(modelBuilder);
    }
}
