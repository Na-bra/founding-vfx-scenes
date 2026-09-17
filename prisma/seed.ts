/**
 * Seeds the database with the demo dataset so the site has content to show.
 *
 *   npm run db:seed            # insert demo content (skips if content exists)
 *   npm run db:seed -- --reset # delete ALL content first, then insert
 *
 * Demo records keep their readable ids (e.g. "sh_henry_danger") so they are
 * easy to find and delete later.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import type { Resolution } from "../types/content";
import { characters, channels, genres, shows, tags } from "../lib/data/sample/taxonomy";
import { scenePacks } from "../lib/data/sample/scenepacks";
import { announcements, changelog, collections, playlists, requests } from "../lib/data/sample/community";

const RES = { "720p": "r720p", "1080p": "r1080p", "1440p": "r1440p", "4K": "r4k" } as const satisfies Record<Resolution, string>;

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("Set DIRECT_URL or DATABASE_URL");

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url.replace(/[?&]pgbouncer=true/, ""), ssl: { rejectUnauthorized: false } }),
});

async function reset() {
  // Children first. Users, sessions and audit logs are left alone.
  await db.$transaction([
    db.collectionItem.deleteMany(),
    db.collection.deleteMany(),
    db.playlistItem.deleteMany(),
    db.playlist.deleteMany(),
    db.requestVote.deleteMany(),
    db.sceneRequest.deleteMany(),
    db.report.deleteMany(),
    db.favorite.deleteMany(),
    db.downloadEvent.deleteMany(),
    db.storageObject.deleteMany(),
    db.scenePackVersion.deleteMany(),
    db.previewMedia.deleteMany(),
    db.scenePackTag.deleteMany(),
    db.scenePackGenre.deleteMany(),
    db.scenePackCharacter.deleteMany(),
    db.scenePack.deleteMany(),
    db.character.deleteMany(),
    db.episode.deleteMany(),
    db.season.deleteMany(),
    db.showGenre.deleteMany(),
    db.show.deleteMany(),
    db.tag.deleteMany(),
    db.genre.deleteMany(),
    db.channel.deleteMany(),
    db.announcement.deleteMany(),
    db.changelogEntry.deleteMany(),
  ]);
}

async function seed() {
  await db.channel.createMany({
    data: channels.map((c) => ({ id: c.id, slug: c.slug, name: c.name, description: c.description })),
  });
  await db.genre.createMany({
    data: genres.map((g) => ({ id: g.id, slug: g.slug, name: g.name, description: g.description })),
  });
  await db.tag.createMany({ data: tags });

  await db.show.createMany({
    data: shows.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      aliases: s.aliases,
      format: s.format,
      description: s.description,
      channelId: s.channelId,
      yearStart: s.yearStart,
      yearEnd: s.yearEnd,
      status: s.status,
    })),
  });
  await db.showGenre.createMany({ data: shows.flatMap((s) => s.genreIds.map((genreId) => ({ showId: s.id, genreId }))) });
  await db.season.createMany({
    data: shows.flatMap((s) =>
      s.seasons.map((n) => ({ showId: s.id, number: n.number, year: n.year ?? null, episodeCount: n.episodeCount ?? null })),
    ),
  });

  await db.character.createMany({
    data: characters.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      aliases: c.aliases,
      showId: c.showId,
      actor: c.actor ?? null,
      description: c.description,
    })),
  });

  await db.scenePack.createMany({
    data: scenePacks.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      showId: p.showId,
      season: p.season ?? null,
      episode: p.episode ?? null,
      episodeTitle: p.episodeTitle ?? null,
      releaseYear: p.releaseYear ?? null,
      resolution: RES[p.technical.resolution],
      fps: p.technical.fps,
      format: p.technical.format,
      fileSizeBytes: BigInt(Math.round(p.technical.fileSizeBytes)),
      clipCount: p.technical.clipCount,
      aspectRatio: p.technical.aspectRatio ?? null,
      hasAudio: p.technical.hasAudio ?? null,
      isRaw: p.editing.raw ?? null,
      isClean: p.editing.clean ?? null,
      isColorGraded: p.editing.colorGraded ?? null,
      isUpscaled: p.editing.upscaled ?? null,
      hasWatermark: p.editing.watermark ?? null,
      version: p.version,
      status: p.status,
      featured: p.featured,
      createdAt: new Date(p.createdAt),
      publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
    })),
  });
  await db.scenePackCharacter.createMany({
    data: scenePacks.flatMap((p) => p.characterIds.map((characterId) => ({ scenePackId: p.id, characterId }))),
  });
  await db.scenePackGenre.createMany({
    data: scenePacks.flatMap((p) => p.genreIds.map((genreId) => ({ scenePackId: p.id, genreId }))),
  });
  await db.scenePackTag.createMany({
    data: scenePacks.flatMap((p) => p.tagSlugs.map((tagSlug) => ({ scenePackId: p.id, tagSlug }))),
  });

  await db.playlist.createMany({
    data: playlists.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      visibility: p.visibility,
      featured: p.featured,
    })),
  });
  await db.playlistItem.createMany({
    data: playlists.flatMap((p) => p.scenePackIds.map((scenePackId, position) => ({ playlistId: p.id, scenePackId, position }))),
  });

  await db.collection.createMany({
    data: collections.map((c) => ({ id: c.id, slug: c.slug, title: c.title, description: c.description, featured: c.featured })),
  });
  await db.collectionItem.createMany({
    data: collections.flatMap((c) => c.items.map((i, position) => ({ collectionId: c.id, type: i.type, targetId: i.id, position }))),
  });

  await db.sceneRequest.createMany({
    data: requests.map((r) => ({
      id: r.id,
      title: r.title,
      showTitle: r.showTitle,
      showId: r.showId ?? null,
      characterName: r.characterName ?? null,
      description: r.description,
      year: r.year ?? null,
      season: r.season ?? null,
      episode: r.episode ?? null,
      genreId: r.genreId ?? null,
      channelId: r.channelId ?? null,
      preferredResolution: r.preferredResolution ? RES[r.preferredResolution] : null,
      preferredFps: r.preferredFps ?? null,
      status: r.status,
      voteCount: r.voteCount,
      highPriority: r.highPriority,
      fulfilledByScenePackId: r.fulfilledByScenePackId ?? null,
      createdAt: new Date(r.createdAt),
    })),
  });

  await db.announcement.createMany({
    data: announcements.map((a) => ({ id: a.id, message: a.message, href: a.href ?? null, tone: a.tone, active: a.active })),
  });
  await db.changelogEntry.createMany({
    data: changelog.map((e) => ({ id: e.id, date: new Date(e.date), title: e.title, changes: e.changes })),
  });
}

async function main() {
  const resetFirst = process.argv.includes("--reset");
  if (resetFirst) {
    await reset();
    console.log("Deleted existing content.");
  } else if ((await db.show.count()) > 0) {
    console.log("Database already has content — skipping. Use --reset to replace it.");
    return;
  }
  await seed();
  const [packs, showCount] = await Promise.all([db.scenePack.count(), db.show.count()]);
  console.log(`Seeded ${showCount} shows and ${packs} ScenePacks.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
