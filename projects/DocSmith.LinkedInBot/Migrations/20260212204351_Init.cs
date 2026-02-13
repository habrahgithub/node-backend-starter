using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DocSmith.LinkedInBot.Migrations
{
    /// <inheritdoc />
    public partial class Init : Migration
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
                name: "PostIdeas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Topic = table.Column<string>(type: "TEXT", nullable: false),
                    Persona = table.Column<string>(type: "TEXT", nullable: false),
                    PostType = table.Column<string>(type: "TEXT", nullable: false),
                    KeyPoint = table.Column<string>(type: "TEXT", nullable: false),
                    CtaStyle = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PostIdeas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PostDrafts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PostIdeaId = table.Column<int>(type: "INTEGER", nullable: false),
                    VariantNo = table.Column<int>(type: "INTEGER", nullable: false),
                    DraftText = table.Column<string>(type: "TEXT", nullable: false),
                    Hashtags = table.Column<string>(type: "TEXT", nullable: false),
                    IsApproved = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ApprovedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PostDrafts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PostDrafts_PostIdeas_PostIdeaId",
                        column: x => x.PostIdeaId,
                        principalTable: "PostIdeas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PostDrafts_PostIdeaId",
                table: "PostDrafts",
                column: "PostIdeaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActivityLogs");

            migrationBuilder.DropTable(
                name: "EngagementTargets");

            migrationBuilder.DropTable(
                name: "PostDrafts");

            migrationBuilder.DropTable(
                name: "PostIdeas");
        }
    }
}
