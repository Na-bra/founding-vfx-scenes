-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('draft', 'scheduled', 'published', 'unpublished');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('public', 'unlisted', 'private');

-- CreateEnum
CREATE TYPE "ShowFormat" AS ENUM ('series', 'film', 'special');

-- CreateEnum
CREATE TYPE "Resolution" AS ENUM ('720p', '1080p', '1440p', '4K');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('pending', 'under_review', 'planned', 'in_progress', 'completed', 'published', 'declined');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('broken_download', 'incorrect_information', 'incorrect_thumbnail', 'duplicate', 'other');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('open', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('owner', 'administrator', 'moderator', 'uploader', 'member');

-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('external_url', 'google_drive', 'mega', 'terabox', 'cloudflare_r2', 'backblaze_b2');

-- CreateEnum
CREATE TYPE "StorageHealth" AS ENUM ('unknown', 'working', 'needs_attention');

-- CreateEnum
CREATE TYPE "CollectionItemType" AS ENUM ('show', 'scenepack', 'playlist');

-- CreateEnum
CREATE TYPE "AnnouncementTone" AS ENUM ('info', 'success', 'warning');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'member',
    "discordName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channels" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "artworkUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "artworkUrl" TEXT,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "shows" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "aliases" TEXT[],
    "format" "ShowFormat" NOT NULL DEFAULT 'series',
    "description" TEXT NOT NULL DEFAULT '',
    "channelId" TEXT NOT NULL,
    "yearStart" INTEGER NOT NULL,
    "yearEnd" INTEGER,
    "posterUrl" TEXT,
    "bannerUrl" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "show_genres" (
    "showId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,

    CONSTRAINT "show_genres_pkey" PRIMARY KEY ("showId","genreId")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "year" INTEGER,
    "episodeCount" INTEGER,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episodes" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT,

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "showId" TEXT NOT NULL,
    "actor" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "artworkUrl" TEXT,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenepacks" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "showId" TEXT NOT NULL,
    "season" INTEGER,
    "episode" INTEGER,
    "episodeTitle" TEXT,
    "releaseYear" INTEGER,
    "thumbnailUrl" TEXT,
    "thumbnailAlt" TEXT,
    "resolution" "Resolution" NOT NULL,
    "fps" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "fileSizeBytes" BIGINT NOT NULL,
    "clipCount" INTEGER NOT NULL,
    "aspectRatio" TEXT,
    "hasAudio" BOOLEAN,
    "isRaw" BOOLEAN,
    "isClean" BOOLEAN,
    "isColorGraded" BOOLEAN,
    "isUpscaled" BOOLEAN,
    "hasWatermark" BOOLEAN,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "status" "PublishStatus" NOT NULL DEFAULT 'draft',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "scenepacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenepack_characters" (
    "scenePackId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,

    CONSTRAINT "scenepack_characters_pkey" PRIMARY KEY ("scenePackId","characterId")
);

-- CreateTable
CREATE TABLE "scenepack_genres" (
    "scenePackId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,

    CONSTRAINT "scenepack_genres_pkey" PRIMARY KEY ("scenePackId","genreId")
);

-- CreateTable
CREATE TABLE "scenepack_tags" (
    "scenePackId" TEXT NOT NULL,
    "tagSlug" TEXT NOT NULL,

    CONSTRAINT "scenepack_tags_pkey" PRIMARY KEY ("scenePackId","tagSlug")
);

-- CreateTable
CREATE TABLE "preview_media" (
    "id" TEXT NOT NULL,
    "scenePackId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "posterUrl" TEXT,
    "alt" TEXT,
    "durationSeconds" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "preview_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenepack_versions" (
    "id" TEXT NOT NULL,
    "scenePackId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "notes" TEXT,
    "storageObjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenepack_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_objects" (
    "id" TEXT NOT NULL,
    "scenePackId" TEXT NOT NULL,
    "provider" "StorageProvider" NOT NULL,
    "objectId" TEXT,
    "downloadUrl" TEXT,
    "fileSizeBytes" BIGINT,
    "fileType" TEXT,
    "checksum" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "health" "StorageHealth" NOT NULL DEFAULT 'unknown',
    "lastCheckedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_objects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlists" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "thumbnailUrl" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'public',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_scenepacks" (
    "playlistId" TEXT NOT NULL,
    "scenePackId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "playlist_scenepacks_pkey" PRIMARY KEY ("playlistId","scenePackId")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "artworkUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_items" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "type" "CollectionItemType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "collection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "showTitle" TEXT NOT NULL,
    "showId" TEXT,
    "characterName" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "year" INTEGER,
    "season" INTEGER,
    "episode" INTEGER,
    "genreId" TEXT,
    "channelId" TEXT,
    "preferredResolution" "Resolution",
    "preferredFps" INTEGER,
    "referenceUrl" TEXT,
    "referenceImageUrl" TEXT,
    "contactDiscord" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "highPriority" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT,
    "mergedIntoId" TEXT,
    "fulfilledByScenePackId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_votes" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT,
    "voterHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "userId" TEXT NOT NULL,
    "scenePackId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("userId","scenePackId")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "scenePackId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "downloads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenePackId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "downloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_metrics" (
    "day" DATE NOT NULL,
    "metric" TEXT NOT NULL,
    "targetId" TEXT NOT NULL DEFAULT '',
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "daily_metrics_pkey" PRIMARY KEY ("day","metric","targetId")
);

-- CreateTable
CREATE TABLE "search_query_stats" (
    "day" DATE NOT NULL,
    "query" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "zeroResult" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "search_query_stats_pkey" PRIMARY KEY ("day","query")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "href" TEXT,
    "tone" "AnnouncementTone" NOT NULL DEFAULT 'info',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "changelog_entries" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "changes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "changelog_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "channels_slug_key" ON "channels"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "genres_slug_key" ON "genres"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "shows_slug_key" ON "shows"("slug");

-- CreateIndex
CREATE INDEX "shows_channelId_idx" ON "shows"("channelId");

-- CreateIndex
CREATE INDEX "shows_status_idx" ON "shows"("status");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_showId_number_key" ON "seasons"("showId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_seasonId_number_key" ON "episodes"("seasonId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "characters_slug_key" ON "characters"("slug");

-- CreateIndex
CREATE INDEX "characters_showId_idx" ON "characters"("showId");

-- CreateIndex
CREATE UNIQUE INDEX "scenepacks_slug_key" ON "scenepacks"("slug");

-- CreateIndex
CREATE INDEX "scenepacks_status_publishedAt_idx" ON "scenepacks"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "scenepacks_showId_season_idx" ON "scenepacks"("showId", "season");

-- CreateIndex
CREATE INDEX "scenepacks_featured_idx" ON "scenepacks"("featured");

-- CreateIndex
CREATE INDEX "scenepack_characters_characterId_idx" ON "scenepack_characters"("characterId");

-- CreateIndex
CREATE INDEX "scenepack_genres_genreId_idx" ON "scenepack_genres"("genreId");

-- CreateIndex
CREATE INDEX "scenepack_tags_tagSlug_idx" ON "scenepack_tags"("tagSlug");

-- CreateIndex
CREATE INDEX "preview_media_scenePackId_position_idx" ON "preview_media"("scenePackId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "scenepack_versions_scenePackId_version_key" ON "scenepack_versions"("scenePackId", "version");

-- CreateIndex
CREATE INDEX "storage_objects_scenePackId_isCurrent_idx" ON "storage_objects"("scenePackId", "isCurrent");

-- CreateIndex
CREATE INDEX "storage_objects_health_idx" ON "storage_objects"("health");

-- CreateIndex
CREATE INDEX "storage_objects_checksum_idx" ON "storage_objects"("checksum");

-- CreateIndex
CREATE UNIQUE INDEX "playlists_slug_key" ON "playlists"("slug");

-- CreateIndex
CREATE INDEX "playlist_scenepacks_playlistId_position_idx" ON "playlist_scenepacks"("playlistId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "collections_slug_key" ON "collections"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "collection_items_collectionId_type_targetId_key" ON "collection_items"("collectionId", "type", "targetId");

-- CreateIndex
CREATE INDEX "requests_status_voteCount_idx" ON "requests"("status", "voteCount");

-- CreateIndex
CREATE INDEX "requests_createdAt_idx" ON "requests"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "request_votes_requestId_userId_key" ON "request_votes"("requestId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "request_votes_requestId_voterHash_key" ON "request_votes"("requestId", "voterHash");

-- CreateIndex
CREATE INDEX "reports_status_createdAt_idx" ON "reports"("status", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE INDEX "downloads_userId_createdAt_idx" ON "downloads"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_targetType_targetId_idx" ON "audit_logs"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shows" ADD CONSTRAINT "shows_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "show_genres" ADD CONSTRAINT "show_genres_showId_fkey" FOREIGN KEY ("showId") REFERENCES "shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "show_genres" ADD CONSTRAINT "show_genres_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_showId_fkey" FOREIGN KEY ("showId") REFERENCES "shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_showId_fkey" FOREIGN KEY ("showId") REFERENCES "shows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenepacks" ADD CONSTRAINT "scenepacks_showId_fkey" FOREIGN KEY ("showId") REFERENCES "shows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenepack_characters" ADD CONSTRAINT "scenepack_characters_scenePackId_fkey" FOREIGN KEY ("scenePackId") REFERENCES "scenepacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenepack_characters" ADD CONSTRAINT "scenepack_characters_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenepack_genres" ADD CONSTRAINT "scenepack_genres_scenePackId_fkey" FOREIGN KEY ("scenePackId") REFERENCES "scenepacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenepack_genres" ADD CONSTRAINT "scenepack_genres_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenepack_tags" ADD CONSTRAINT "scenepack_tags_scenePackId_fkey" FOREIGN KEY ("scenePackId") REFERENCES "scenepacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenepack_tags" ADD CONSTRAINT "scenepack_tags_tagSlug_fkey" FOREIGN KEY ("tagSlug") REFERENCES "tags"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preview_media" ADD CONSTRAINT "preview_media_scenePackId_fkey" FOREIGN KEY ("scenePackId") REFERENCES "scenepacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenepack_versions" ADD CONSTRAINT "scenepack_versions_scenePackId_fkey" FOREIGN KEY ("scenePackId") REFERENCES "scenepacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_objects" ADD CONSTRAINT "storage_objects_scenePackId_fkey" FOREIGN KEY ("scenePackId") REFERENCES "scenepacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_scenepacks" ADD CONSTRAINT "playlist_scenepacks_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_scenepacks" ADD CONSTRAINT "playlist_scenepacks_scenePackId_fkey" FOREIGN KEY ("scenePackId") REFERENCES "scenepacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_showId_fkey" FOREIGN KEY ("showId") REFERENCES "shows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "genres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_fulfilledByScenePackId_fkey" FOREIGN KEY ("fulfilledByScenePackId") REFERENCES "scenepacks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_votes" ADD CONSTRAINT "request_votes_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_votes" ADD CONSTRAINT "request_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_scenePackId_fkey" FOREIGN KEY ("scenePackId") REFERENCES "scenepacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_scenePackId_fkey" FOREIGN KEY ("scenePackId") REFERENCES "scenepacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_scenePackId_fkey" FOREIGN KEY ("scenePackId") REFERENCES "scenepacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Row Level Security
-- Supabase exposes the public schema through its REST API using the anon key.
-- RLS with no policies blocks that API entirely; the app connects as the
-- postgres role (which bypasses RLS) through server-side code only.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "channels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "genres" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "show_genres" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "seasons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "episodes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "characters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "scenepacks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "scenepack_characters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "scenepack_genres" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "scenepack_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "preview_media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "scenepack_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "storage_objects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "playlists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "playlist_scenepacks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "collections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "collection_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "request_votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "favorites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "downloads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "daily_metrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "search_query_stats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "announcements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "changelog_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
