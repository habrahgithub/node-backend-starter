using DocSmith.Pulse.Core.Entities;
using DocSmith.Pulse.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace DocSmith.Pulse.Infrastructure.Data;

public class PulseDbContext : DbContext
{
    public PulseDbContext(DbContextOptions<PulseDbContext> options) : base(options)
    {
    }

    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<BrandVoice> BrandVoices => Set<BrandVoice>();
    public DbSet<Campaign> Campaigns => Set<Campaign>();
    public DbSet<ContentIdea> ContentIdeas => Set<ContentIdea>();
    public DbSet<ContentDraft> ContentDrafts => Set<ContentDraft>();
    public DbSet<EngagementTarget> EngagementTargets => Set<EngagementTarget>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<SafetyState> SafetyStates => Set<SafetyState>();
    public DbSet<MediaAsset> MediaAssets => Set<MediaAsset>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ContentIdea>()
            .Property(x => x.Status)
            .HasConversion<string>();

        modelBuilder.Entity<ContentIdea>()
            .Property(x => x.ContentType)
            .HasConversion<string>();

        modelBuilder.Entity<ContentIdea>()
            .Property(x => x.CtaStyle)
            .HasConversion<string>();

        modelBuilder.Entity<ContentDraft>()
            .Property(x => x.Channel)
            .HasConversion<string>();

        modelBuilder.Entity<ActivityLog>()
            .Property(x => x.ActivityType)
            .HasConversion<string>();

        modelBuilder.Entity<MediaAsset>()
            .Property(x => x.MediaAssetType)
            .HasConversion<string>();

        modelBuilder.Entity<ContentIdea>()
            .HasOne(x => x.Campaign)
            .WithMany()
            .HasForeignKey(x => x.CampaignId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ContentDraft>()
            .HasOne(x => x.ContentIdea)
            .WithMany()
            .HasForeignKey(x => x.ContentIdeaId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ContentDraft>()
            .HasIndex(x => new { x.ContentIdeaId, x.VariantNo, x.Channel })
            .IsUnique();

        modelBuilder.Entity<ContentIdea>()
            .HasIndex(x => x.Status);

        modelBuilder.Entity<ContentIdea>()
            .HasIndex(x => x.ScheduledForUtc);

        modelBuilder.Entity<EngagementTarget>()
            .HasIndex(x => x.Status);

        modelBuilder.Entity<ActivityLog>()
            .HasIndex(x => x.ActivityAtUtc);

        modelBuilder.Entity<AuditLog>()
            .HasIndex(x => x.OccurredAtUtc);

        modelBuilder.Entity<MediaAsset>()
            .HasIndex(x => x.CreatedAtUtc);

        modelBuilder.Entity<SafetyState>()
            .HasKey(x => x.Id);

        modelBuilder.Entity<SafetyState>().HasData(new SafetyState
        {
            Id = SafetyState.SingletonId,
            GlobalKillSwitchEnabled = false,
            OrganizationSafeModeEnabled = true,
            AiGenerationEnabled = false,
            SchedulerEnabled = false,
            ExportsEnabled = true,
            UpdatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        modelBuilder.Entity<UserProfile>().HasData(new UserProfile
        {
            Id = 1,
            DisplayName = "Prime",
            Email = "",
            CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        modelBuilder.Entity<BrandVoice>().HasData(new BrandVoice
        {
            Id = 1,
            Name = "DocSmith Professional",
            Persona = "SME Founder",
            ToneRules = "Authoritative, compliance-aware, practical, concise.",
            ForbiddenClaimsCsv = "guaranteed,official,MoHRE approved",
            AvoidFearMarketing = true,
            AvoidEmojis = true,
            IsDefault = true,
            CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        base.OnModelCreating(modelBuilder);
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        EnforceAuditImmutability();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        EnforceAuditImmutability();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void EnforceAuditImmutability()
    {
        foreach (var entry in ChangeTracker.Entries<AuditLog>())
        {
            if (entry.State is EntityState.Modified or EntityState.Deleted)
            {
                throw new InvalidOperationException("AuditLog is immutable and append-only.");
            }
        }
    }
}
