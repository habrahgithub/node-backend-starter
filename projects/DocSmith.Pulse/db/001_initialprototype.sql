CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" TEXT NOT NULL CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY,
    "ProductVersion" TEXT NOT NULL
);

BEGIN TRANSACTION;

CREATE TABLE "ActivityLogs" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_ActivityLogs" PRIMARY KEY AUTOINCREMENT,
    "ActivityType" TEXT NOT NULL,
    "Title" TEXT NOT NULL,
    "Notes" TEXT NOT NULL,
    "ContentIdeaId" INTEGER NULL,
    "EngagementTargetId" INTEGER NULL,
    "ActivityAtUtc" TEXT NOT NULL,
    "Impressions" INTEGER NULL,
    "Reactions" INTEGER NULL,
    "Comments" INTEGER NULL,
    "Clicks" INTEGER NULL
);

CREATE TABLE "AuditLogs" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_AuditLogs" PRIMARY KEY AUTOINCREMENT,
    "OccurredAtUtc" TEXT NOT NULL,
    "Actor" TEXT NOT NULL,
    "Action" TEXT NOT NULL,
    "EntityType" TEXT NOT NULL,
    "EntityId" TEXT NOT NULL,
    "InputSummary" TEXT NOT NULL,
    "SourcePath" TEXT NOT NULL,
    "WasBlocked" INTEGER NOT NULL,
    "Reason" TEXT NOT NULL
);

CREATE TABLE "BrandVoices" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_BrandVoices" PRIMARY KEY AUTOINCREMENT,
    "Name" TEXT NOT NULL,
    "Persona" TEXT NOT NULL,
    "ToneRules" TEXT NOT NULL,
    "ForbiddenClaimsCsv" TEXT NOT NULL,
    "AvoidFearMarketing" INTEGER NOT NULL,
    "AvoidEmojis" INTEGER NOT NULL,
    "IsDefault" INTEGER NOT NULL,
    "CreatedAtUtc" TEXT NOT NULL
);

CREATE TABLE "Campaigns" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Campaigns" PRIMARY KEY AUTOINCREMENT,
    "Name" TEXT NOT NULL,
    "Objective" TEXT NOT NULL,
    "StartsOnUtc" TEXT NULL,
    "EndsOnUtc" TEXT NULL,
    "CreatedAtUtc" TEXT NOT NULL
);

CREATE TABLE "EngagementTargets" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_EngagementTargets" PRIMARY KEY AUTOINCREMENT,
    "PostUrl" TEXT NOT NULL,
    "AuthorName" TEXT NOT NULL,
    "PostSummary" TEXT NOT NULL,
    "DraftCommentShort" TEXT NOT NULL,
    "DraftCommentMedium" TEXT NOT NULL,
    "Status" TEXT NOT NULL,
    "CreatedAtUtc" TEXT NOT NULL
);

CREATE TABLE "MediaAssets" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_MediaAssets" PRIMARY KEY AUTOINCREMENT,
    "MediaAssetType" TEXT NOT NULL,
    "Query" TEXT NOT NULL,
    "Title" TEXT NOT NULL,
    "Url" TEXT NOT NULL,
    "ThumbnailUrl" TEXT NOT NULL,
    "Source" TEXT NOT NULL,
    "Prompt" TEXT NOT NULL,
    "ContentText" TEXT NOT NULL,
    "CreatedAtUtc" TEXT NOT NULL
);

CREATE TABLE "SafetyStates" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_SafetyStates" PRIMARY KEY AUTOINCREMENT,
    "GlobalKillSwitchEnabled" INTEGER NOT NULL,
    "OrganizationSafeModeEnabled" INTEGER NOT NULL,
    "AiGenerationEnabled" INTEGER NOT NULL,
    "SchedulerEnabled" INTEGER NOT NULL,
    "ExportsEnabled" INTEGER NOT NULL,
    "UpdatedAtUtc" TEXT NOT NULL
);

CREATE TABLE "UserProfiles" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_UserProfiles" PRIMARY KEY AUTOINCREMENT,
    "DisplayName" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "CreatedAtUtc" TEXT NOT NULL
);

CREATE TABLE "ContentIdeas" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_ContentIdeas" PRIMARY KEY AUTOINCREMENT,
    "Topic" TEXT NOT NULL,
    "Persona" TEXT NOT NULL,
    "ContentType" TEXT NOT NULL,
    "KeyPoint" TEXT NOT NULL,
    "CtaStyle" TEXT NOT NULL,
    "Status" TEXT NOT NULL,
    "CampaignId" INTEGER NULL,
    "CreatedAtUtc" TEXT NOT NULL,
    "ScheduledForUtc" TEXT NULL,
    CONSTRAINT "FK_ContentIdeas_Campaigns_CampaignId" FOREIGN KEY ("CampaignId") REFERENCES "Campaigns" ("Id") ON DELETE SET NULL
);

CREATE TABLE "ContentDrafts" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_ContentDrafts" PRIMARY KEY AUTOINCREMENT,
    "ContentIdeaId" INTEGER NOT NULL,
    "VariantNo" INTEGER NOT NULL,
    "Channel" TEXT NOT NULL,
    "DraftText" TEXT NOT NULL,
    "Hashtags" TEXT NOT NULL,
    "IsApproved" INTEGER NOT NULL,
    "CreatedAtUtc" TEXT NOT NULL,
    "ApprovedAtUtc" TEXT NULL,
    CONSTRAINT "FK_ContentDrafts_ContentIdeas_ContentIdeaId" FOREIGN KEY ("ContentIdeaId") REFERENCES "ContentIdeas" ("Id") ON DELETE CASCADE
);

INSERT INTO "BrandVoices" ("Id", "AvoidEmojis", "AvoidFearMarketing", "CreatedAtUtc", "ForbiddenClaimsCsv", "IsDefault", "Name", "Persona", "ToneRules")
VALUES (1, 1, 1, '2026-01-01 00:00:00', 'guaranteed,official,MoHRE approved', 1, 'DocSmith Professional', 'SME Founder', 'Authoritative, compliance-aware, practical, concise.');
SELECT changes();


INSERT INTO "SafetyStates" ("Id", "AiGenerationEnabled", "ExportsEnabled", "GlobalKillSwitchEnabled", "OrganizationSafeModeEnabled", "SchedulerEnabled", "UpdatedAtUtc")
VALUES (1, 0, 1, 0, 1, 0, '2026-01-01 00:00:00');
SELECT changes();


INSERT INTO "UserProfiles" ("Id", "CreatedAtUtc", "DisplayName", "Email")
VALUES (1, '2026-01-01 00:00:00', 'Prime', '');
SELECT changes();


CREATE INDEX "IX_ActivityLogs_ActivityAtUtc" ON "ActivityLogs" ("ActivityAtUtc");

CREATE INDEX "IX_AuditLogs_OccurredAtUtc" ON "AuditLogs" ("OccurredAtUtc");

CREATE UNIQUE INDEX "IX_ContentDrafts_ContentIdeaId_VariantNo_Channel" ON "ContentDrafts" ("ContentIdeaId", "VariantNo", "Channel");

CREATE INDEX "IX_ContentIdeas_CampaignId" ON "ContentIdeas" ("CampaignId");

CREATE INDEX "IX_ContentIdeas_ScheduledForUtc" ON "ContentIdeas" ("ScheduledForUtc");

CREATE INDEX "IX_ContentIdeas_Status" ON "ContentIdeas" ("Status");

CREATE INDEX "IX_EngagementTargets_Status" ON "EngagementTargets" ("Status");

CREATE INDEX "IX_MediaAssets_CreatedAtUtc" ON "MediaAssets" ("CreatedAtUtc");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260212212653_InitialPrototype', '8.0.0');

COMMIT;

