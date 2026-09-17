import "server-only";

import type { Dataset } from "@/lib/data/memory/repository";
import type { EditingInfo, PreviewMedia } from "@/types/content";
import { getDb } from "@/lib/db";
import { dateOnly, image, iso, isoOrNull, orUndefined, resolutionFromDb } from "./mappers";

/**
 * Loads everything the public site can show into plain domain records.
 * Drafts are loaded too; the repository applies visibility rules (including
 * scheduled publishing) at read time so a pack goes live without a reload.
 */
export async function loadDataset(options: { previewScenePackId?: string } = {}): Promise<Dataset> {
  const db = getDb();
  const preview = options.previewScenePackId;
  // Batched rather than one big Promise.all: a single page must not hold more
  // connections than the pool has, or concurrent writes can't get one.
  const [channels, genres, tags, shows] = await Promise.all([
      db.channel.findMany({ orderBy: { name: "asc" } }),
      db.genre.findMany({ orderBy: { name: "asc" } }),
      db.tag.findMany({ orderBy: { label: "asc" } }),
      db.show.findMany({
        // A preview may belong to a show that isn't published yet.
        where: preview ? {} : { status: { in: ["published", "scheduled"] } },
        include: { genres: true, seasons: { orderBy: { number: "asc" } } },
      }),
  ]);
  const [characters, packs] = await Promise.all([
      db.character.findMany(),
      db.scenePack.findMany({
        where: preview ? { OR: [{ status: { in: ["published", "scheduled"] } }, { id: preview }] } : { status: { in: ["published", "scheduled"] } },
        include: {
          characters: true,
          genres: true,
          tags: true,
          previews: { orderBy: { position: "asc" } },
        },
      }),
  ]);
  const [playlists, collections, requests, announcements, changelog] = await Promise.all([
      db.playlist.findMany({
        where: { ownerId: null, visibility: { not: "private" } },
        include: { items: { orderBy: { position: "asc" } } },
      }),
      db.collection.findMany({ include: { items: { orderBy: { position: "asc" } } }, orderBy: { updatedAt: "desc" } }),
      db.sceneRequest.findMany({ where: { mergedIntoId: null }, orderBy: { createdAt: "desc" } }),
      db.announcement.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } }),
      db.changelogEntry.findMany({ orderBy: { date: "desc" } }),
    ]);

  return {
    channels: channels.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      artwork: image(c.artworkUrl, null, `${c.name} artwork`),
    })),
    genres: genres.map((g) => ({
      id: g.id,
      slug: g.slug,
      name: g.name,
      description: g.description,
      artwork: image(g.artworkUrl, null, `${g.name} artwork`),
    })),
    tags: tags.map((t) => ({ slug: t.slug, label: t.label })),
    shows: shows.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      aliases: s.aliases,
      format: s.format,
      description: s.description,
      channelId: s.channelId,
      genreIds: s.genres.map((g) => g.genreId),
      yearStart: s.yearStart,
      yearEnd: s.yearEnd,
      seasons: s.seasons.map((n) => ({ number: n.number, year: orUndefined(n.year), episodeCount: orUndefined(n.episodeCount) })),
      poster: image(s.posterUrl, null, `${s.title} poster`),
      banner: image(s.bannerUrl, null, `${s.title} banner`),
      // Scheduled shows are treated as published; shows have no publish time of their own.
      status: "published" as const,
    })),
    characters: characters.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      aliases: c.aliases,
      showId: c.showId,
      actor: orUndefined(c.actor),
      description: c.description,
      artwork: image(c.artworkUrl, null, c.name),
    })),
    scenePacks: packs.map((p) => {
      const editing: EditingInfo = {};
      if (p.isRaw !== null) editing.raw = p.isRaw;
      if (p.isClean !== null) editing.clean = p.isClean;
      if (p.isColorGraded !== null) editing.colorGraded = p.isColorGraded;
      if (p.isUpscaled !== null) editing.upscaled = p.isUpscaled;
      if (p.hasWatermark !== null) editing.watermark = p.hasWatermark;

      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: p.description,
        showId: p.showId,
        characterIds: p.characters.map((c) => c.characterId),
        genreIds: p.genres.map((g) => g.genreId),
        tagSlugs: p.tags.map((t) => t.tagSlug),
        season: orUndefined(p.season),
        episode: orUndefined(p.episode),
        episodeTitle: orUndefined(p.episodeTitle),
        releaseYear: orUndefined(p.releaseYear),
        thumbnail: image(p.thumbnailUrl, p.thumbnailAlt, p.title),
        previews: p.previews.map(
          (m): PreviewMedia =>
            m.kind === "video"
              ? {
                  kind: "video",
                  src: m.url,
                  poster: image(m.posterUrl, m.alt, p.title),
                  durationSeconds: orUndefined(m.durationSeconds),
                }
              : { kind: "image", image: { src: m.url, alt: m.alt || p.title } },
        ),
        technical: {
          resolution: resolutionFromDb(p.resolution),
          fps: p.fps,
          format: p.format,
          fileSizeBytes: Number(p.fileSizeBytes),
          clipCount: p.clipCount,
          aspectRatio: orUndefined(p.aspectRatio),
          hasAudio: orUndefined(p.hasAudio),
        },
        editing,
        version: p.version,
        status: p.status,
        featured: p.featured,
        createdAt: iso(p.createdAt),
        updatedAt: iso(p.updatedAt),
        publishedAt: isoOrNull(p.publishedAt),
      };
    }),
    playlists: playlists.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      thumbnail: image(p.thumbnailUrl, null, p.title),
      scenePackIds: p.items.map((i) => i.scenePackId),
      visibility: p.visibility,
      featured: p.featured,
      updatedAt: iso(p.updatedAt),
    })),
    collections: collections.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      artwork: image(c.artworkUrl, null, c.title),
      items: c.items.map((i) => ({ type: i.type, id: i.targetId })),
      featured: c.featured,
      updatedAt: iso(c.updatedAt),
    })),
    requests: requests.map((r) => ({
      id: r.id,
      title: r.title,
      showTitle: r.showTitle,
      showId: orUndefined(r.showId),
      characterName: orUndefined(r.characterName),
      description: r.description,
      year: orUndefined(r.year),
      genreId: orUndefined(r.genreId),
      channelId: orUndefined(r.channelId),
      season: orUndefined(r.season),
      episode: orUndefined(r.episode),
      preferredResolution: r.preferredResolution ? resolutionFromDb(r.preferredResolution) : undefined,
      preferredFps: orUndefined(r.preferredFps),
      status: r.status,
      voteCount: r.voteCount,
      highPriority: r.highPriority,
      fulfilledByScenePackId: orUndefined(r.fulfilledByScenePackId),
      createdAt: iso(r.createdAt),
      updatedAt: iso(r.updatedAt),
    })),
    announcements: announcements.map((a) => ({
      id: a.id,
      message: a.message,
      href: orUndefined(a.href),
      tone: a.tone,
      active: a.active,
      startsAt: a.startsAt ? iso(a.startsAt) : undefined,
      endsAt: a.endsAt ? iso(a.endsAt) : undefined,
    })),
    changelog: changelog.map((e) => ({ id: e.id, date: dateOnly(e.date), title: e.title, changes: e.changes })),
  };
}
