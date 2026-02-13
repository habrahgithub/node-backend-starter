using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DocSmith.Pulse.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialPrototype : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ActivityLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ActivityType = table.Column<string>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", nullable: false),
                    ContentIdeaId = table.Column<int>(type: "INTEGER", nullable: true),
                    EngagementTargetId = table.Column<int>(type: "INTEGER", nullable: true),
                    ActivityAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Impressions = table.Column<int>(type: "INTEGER", nullable: true),
                    Reactions = table.Column<int>(type: "INTEGER", nullable: true),
                    Comments = table.Column<int>(type: "INTEGER", nullable: true),
                    Clicks = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    OccurredAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Actor = table.Column<string>(type: "TEXT", nullable: false),
                    Action = table.Column<string>(type: "TEXT", nullable: false),
                    EntityType = table.Column<string>(type: "TEXT", nullable: false),
                    EntityId = table.Column<string>(type: "TEXT", nullable: false),
                    InputSummary = table.Column<string>(type: "TEXT", nullable: false),
                    SourcePath = table.Column<string>(type: "TEXT", nullable: false),
                    WasBlocked = table.Column<bool>(type: "INTEGER", nullable: false),
                    Reason = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BrandVoices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Persona = table.Column<string>(type: "TEXT", nullable: false),
                    ToneRules = table.Column<string>(type: "TEXT", nullable: false),
                    ForbiddenClaimsCsv = table.Column<string>(type: "TEXT", nullable: false),
                    AvoidFearMarketing = table.Column<bool>(type: "INTEGER", nullable: false),
                    AvoidEmojis = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsDefault = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BrandVoices", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Campaigns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Objective = table.Column<string>(type: "TEXT", nullable: false),
                    StartsOnUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    EndsOnUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Campaigns", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EngagementTargets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PostUrl = table.Column<string>(type: "TEXT", nullable: false),
                    AuthorName = table.Column<string>(type: "TEXT", nullable: false),
                    PostSummary = table.Column<string>(type: "TEXT", nullable: false),
                    DraftCommentShort = table.Column<string>(type: "TEXT", nullable: false),
                    DraftCommentMedium = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EngagementTargets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MediaAssets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MediaAssetType = table.Column<string>(type: "TEXT", nullable: false),
                    Query = table.Column<string>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    Url = table.Column<string>(type: "TEXT", nullable: false),
                    ThumbnailUrl = table.Column<string>(type: "TEXT", nullable: false),
                    Source = table.Column<string>(type: "TEXT", nullable: false),
                    Prompt = table.Column<string>(type: "TEXT", nullable: false),
                    ContentText = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MediaAssets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SafetyStates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    GlobalKillSwitchEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    OrganizationSafeModeEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    AiGenerationEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    SchedulerEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    ExportsEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SafetyStates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserProfiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    DisplayName = table.Column<string>(type: "TEXT", nullable: false),
                    Email = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserProfiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ContentIdeas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Topic = table.Column<string>(type: "TEXT", nullable: false),
                    Persona = table.Column<string>(type: "TEXT", nullable: false),
                    ContentType = table.Column<string>(type: "TEXT", nullable: false),
                    KeyPoint = table.Column<string>(type: "TEXT", nullable: false),
                    CtaStyle = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    CampaignId = table.Column<int>(type: "INTEGER", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ScheduledForUtc = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContentIdeas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContentIdeas_Campaigns_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "Campaigns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ContentDrafts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ContentIdeaId = table.Column<int>(type: "INTEGER", nullable: false),
                    VariantNo = table.Column<int>(type: "INTEGER", nullable: false),
                    Channel = table.Column<string>(type: "TEXT", nullable: false),
                    DraftText = table.Column<string>(type: "TEXT", nullable: false),
                    Hashtags = table.Column<string>(type: "TEXT", nullable: false),
                    IsApproved = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ApprovedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContentDrafts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContentDrafts_ContentIdeas_ContentIdeaId",
                        column: x => x.ContentIdeaId,
                        principalTable: "ContentIdeas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "BrandVoices",
                columns: new[] { "Id", "AvoidEmojis", "AvoidFearMarketing", "CreatedAtUtc", "ForbiddenClaimsCsv", "IsDefault", "Name", "Persona", "ToneRules" },
                values: new object[] { 1, true, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "guaranteed,official,MoHRE approved", true, "DocSmith Professional", "SME Founder", "Authoritative, compliance-aware, practical, concise." });

            migrationBuilder.InsertData(
                table: "SafetyStates",
                columns: new[] { "Id", "AiGenerationEnabled", "ExportsEnabled", "GlobalKillSwitchEnabled", "OrganizationSafeModeEnabled", "SchedulerEnabled", "UpdatedAtUtc" },
                values: new object[] { 1, false, true, false, true, false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) });

            migrationBuilder.InsertData(
                table: "UserProfiles",
                columns: new[] { "Id", "CreatedAtUtc", "DisplayName", "Email" },
                values: new object[] { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Prime", "" });

            migrationBuilder.CreateIndex(
                name: "IX_ActivityLogs_ActivityAtUtc",
                table: "ActivityLogs",
                column: "ActivityAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_OccurredAtUtc",
                table: "AuditLogs",
                column: "OccurredAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_ContentDrafts_ContentIdeaId_VariantNo_Channel",
                table: "ContentDrafts",
                columns: new[] { "ContentIdeaId", "VariantNo", "Channel" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContentIdeas_CampaignId",
                table: "ContentIdeas",
                column: "CampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_ContentIdeas_ScheduledForUtc",
                table: "ContentIdeas",
                column: "ScheduledForUtc");

            migrationBuilder.CreateIndex(
                name: "IX_ContentIdeas_Status",
                table: "ContentIdeas",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_EngagementTargets_Status",
                table: "EngagementTargets",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_MediaAssets_CreatedAtUtc",
                table: "MediaAssets",
                column: "CreatedAtUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActivityLogs");

            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "BrandVoices");

            migrationBuilder.DropTable(
                name: "ContentDrafts");

            migrationBuilder.DropTable(
                name: "EngagementTargets");

            migrationBuilder.DropTable(
                name: "MediaAssets");

            migrationBuilder.DropTable(
                name: "SafetyStates");

            migrationBuilder.DropTable(
                name: "UserProfiles");

            migrationBuilder.DropTable(
                name: "ContentIdeas");

            migrationBuilder.DropTable(
                name: "Campaigns");
        }
    }
}
