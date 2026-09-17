import "server-only";

import type {
  Announcement,
  ChangelogEntry,
  Channel,
  Character,
  Collection,
  Genre,
  ID,
  Playlist,
  SceneRequest,
  ScenePack,
  ScenePackView,
  Show,
  Tag,
} from "@/types/content";
import type {
  ChannelSummary,
  CharacterSummary,
  CollectionSummary,
  ContentRepository,
  FacetOption,
  GenreSummary,
  PlaylistSummary,
  RequestQuery,
  RequestView,
  ScenePackFacets,
  ScenePackQuery,
  SearchResults,
  SearchSuggestion,
  NewReport,
  ShowSummary,
  SizeBucket,
} from "@/lib/data/repository";
import { parseSearchQuery } from "@/lib/search/query-parser";
import { normalize, scoreDocument, tokenize, type WeightedField } from "@/lib/search/text";

/** Everything the public site reads, as plain domain records. */
export type Dataset = {
  channels: Channel[];
  genres: Genre[];
  tags: Tag[];
  shows: Show[];
  characters: Character[];
  scenePacks: ScenePack[];
  playlists: Playlist[];
  collections: Collection[];
  requests: SceneRequest[];
  announcements: Announcement[];
  changelog: ChangelogEntry[];
};

export type RepositoryHooks = {
  source: ContentRepository["source"];
  createReport(report: NewReport): Promise<{ id: ID }>;
};

const GB = 1024 ** 3;

function byId<T extends { id: ID }>(items: T[]): Map<ID, T> {
  return new Map(items.map((i) => [i.id, i]));
}

export function sizeBucket(bytes: number): SizeBucket {
  if (bytes < 2 * GB) return "small";
  if (bytes <= 8 * GB) return "medium";
  return "large";
}

const SIZE_LABELS: Record<SizeBucket, string> = {
  small: "Under 2 GB",
  medium: "2–8 GB",
  large: "Over 8 GB",
};

function isPublic(pack: ScenePack, now = Date.now()): boolean {
  if (!pack.publishedAt || Date.parse(pack.publishedAt) > now) return false;
  return pack.status === "published" || pack.status === "scheduled";
}

function publishedTime(p: ScenePackView): number {
  return p.publishedAt ? Date.parse(p.publishedAt) : 0;
}

function newestFirst(a: ScenePackView, b: ScenePackView) {
  return publishedTime(b) - publishedTime(a);
}

function facet(values: Iterable<[string, string]>, sort: "count" | "label" | "numeric-desc" = "count"): FacetOption[] {
  const counts = new Map<string, FacetOption>();
  for (const [value, label] of values) {
    const existing = counts.get(value);
    if (existing) existing.count++;
    else counts.set(value, { value, label, count: 1 });
  }
  const list = [...counts.values()];
  if (sort === "label") return list.sort((a, b) => a.label.localeCompare(b.label));
  if (sort === "numeric-desc") return list.sort((a, b) => Number(b.value) - Number(a.value));
  return list.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

const RESOLUTION_ORDER = ["720p", "1080p", "1440p", "4K"];

/**
 * Demand score for "Popular": votes decay gently with age so stale requests
 * don't dominate forever. High priority is an admin-only flag.
 */
function demandScore(r: SceneRequest, now = Date.now()): number {
  const ageDays = Math.max(0, (now - Date.parse(r.createdAt)) / 86_400_000);
  return (r.voteCount + 1) / Math.pow(ageDays + 2, 0.35) + (r.highPriority ? 1000 : 0);
}

const OPEN_STATUSES = new Set(["pending", "under_review", "planned", "in_progress"]);

/**
 * Implements the full ContentRepository over an in-memory dataset: visibility
 * rules, filtering, facets, search, recommendations and request ranking.
 * Used directly for demo data and on top of a periodically refreshed database
 * snapshot for production.
 */
export function buildMemoryRepository(ds: Dataset, hooks: RepositoryHooks): ContentRepository {
  const { channels, genres, tags, shows, playlists, collections, requests, announcements, changelog } = ds;
  // Hidden (draft/unpublished) shows are absent from the dataset; drop anything that belongs to them.
  const visibleShowIds = new Set(shows.map((s) => s.id));
  const characters = ds.characters.filter((c) => visibleShowIds.has(c.showId));
  const scenePacks = ds.scenePacks.filter((p) => visibleShowIds.has(p.showId));

  const showsById = byId(shows);
  const channelsById = byId(channels);
  const genresById = byId(genres);
  const charactersById = byId(characters);
  const playlistsById = byId(playlists);
  const tagsBySlug = new Map(tags.map((t) => [t.slug, t]));

  function toView(pack: ScenePack): ScenePackView {
    const show = showsById.get(pack.showId);
    if (!show) throw new Error(`ScenePack ${pack.id} references missing show ${pack.showId}`);
    const channel = channelsById.get(show.channelId)!;
    return {
      ...pack,
      show: { id: show.id, slug: show.slug, title: show.title, yearStart: show.yearStart, yearEnd: show.yearEnd },
      channel: { id: channel.id, slug: channel.slug, name: channel.name },
      characters: pack.characterIds
        .map((id) => charactersById.get(id))
        .filter((c): c is Character => Boolean(c))
        .map(({ id, slug, name }) => ({ id, slug, name })),
      genres: pack.genreIds
        .map((id) => genresById.get(id))
        .filter((g): g is Genre => Boolean(g))
        .map(({ id, slug, name }) => ({ id, slug, name })),
      tags: pack.tagSlugs.map((s) => tagsBySlug.get(s) ?? { slug: s, label: s }),
    };
  }

  function publicPacks(): ScenePackView[] {
    const now = Date.now();
    return scenePacks.filter((p) => isPublic(p, now)).map(toView);
  }

  function scenePackFields(p: ScenePackView): WeightedField[] {
    const show = showsById.get(p.showId)!;
    return [
      { text: p.title, weight: 5 },
      { text: p.show.title, weight: 4 },
      { text: show.aliases.join(" "), weight: 2 },
      { text: p.characters.map((c) => c.name).join(" "), weight: 4 },
      {
        text: p.characterIds
          .map((id) => charactersById.get(id)?.aliases.join(" ") ?? "")
          .join(" "),
        weight: 3,
      },
      { text: p.channel.name, weight: 2 },
      { text: p.genres.map((g) => g.name).join(" "), weight: 2 },
      { text: p.tags.map((t) => t.label).join(" "), weight: 2 },
      { text: p.episodeTitle ?? "", weight: 2 },
      { text: p.description, weight: 1 },
    ];
  }

  function showSummary(show: Show, packs: ScenePackView[]): ShowSummary {
    const channel = channelsById.get(show.channelId)!;
    return {
      ...show,
      channel: { id: channel.id, slug: channel.slug, name: channel.name },
      genres: show.genreIds.map((id) => genresById.get(id)!).map(({ id, slug, name }) => ({ id, slug, name })),
      scenePackCount: packs.filter((p) => p.showId === show.id).length,
    };
  }

  function characterSummary(c: Character, packs: ScenePackView[]): CharacterSummary {
    const show = showsById.get(c.showId)!;
    return {
      ...c,
      show: { id: show.id, slug: show.slug, title: show.title },
      scenePackCount: packs.filter((p) => p.characterIds.includes(c.id)).length,
    };
  }

  function channelSummary(c: Channel, packs: ScenePackView[]): ChannelSummary {
    return {
      ...c,
      showCount: publicShows().filter((s) => s.channelId === c.id).length,
      scenePackCount: packs.filter((p) => p.channel.id === c.id).length,
    };
  }

  function genreSummary(g: Genre, packs: ScenePackView[]): GenreSummary {
    return {
      ...g,
      showCount: publicShows().filter((s) => s.genreIds.includes(g.id)).length,
      scenePackCount: packs.filter((p) => p.genreIds.includes(g.id)).length,
    };
  }

  function playlistSummary(pl: Playlist, packs: ScenePackView[]): PlaylistSummary {
    const byPackId = new Map(packs.map((p) => [p.id, p]));
    const ordered = pl.scenePackIds.map((id) => byPackId.get(id)).filter((p): p is ScenePackView => Boolean(p));
    return { ...pl, scenePackCount: ordered.length, coverPacks: ordered.slice(0, 4) };
  }

  function collectionSummary(c: Collection): CollectionSummary {
    return { ...c, itemCount: c.items.length };
  }

  function publicShows(): Show[] {
    return shows.filter((s) => s.status === "published");
  }

  function publicPlaylists(): Playlist[] {
    return playlists.filter((p) => p.visibility === "public");
  }

  function requestView(r: SceneRequest, packs: ScenePackView[]): RequestView {
    const show = r.showId ? showsById.get(r.showId) : undefined;
    const genre = r.genreId ? genresById.get(r.genreId) : undefined;
    const channel = r.channelId ? channelsById.get(r.channelId) : undefined;
    const pack = r.fulfilledByScenePackId ? packs.find((p) => p.id === r.fulfilledByScenePackId) : undefined;
    return {
      ...r,
      show: show && { id: show.id, slug: show.slug, title: show.title },
      genre: genre && { id: genre.id, slug: genre.slug, name: genre.name },
      channel: channel && { id: channel.id, slug: channel.slug, name: channel.name },
      fulfilledBy: pack && { id: pack.id, slug: pack.slug, title: pack.title },
    };
  }

  /**
   * Demand score for "Popular": votes decay gently with age so that stale
   * requests don't dominate forever. High priority is an admin-only flag.
   */

  return {
    source: hooks.source,

    async listScenePacks(query: ScenePackQuery) {
      const parsed = query.q ? parseSearchQuery(query.q) : null;
      const resolution = query.resolution ?? parsed?.resolution;
      const fps = query.fps ?? parsed?.fps;
      const season = query.season ?? parsed?.season;

      let items = publicPacks().filter((p) => {
        if (query.show && p.show.slug !== query.show) return false;
        if (query.channel && p.channel.slug !== query.channel) return false;
        if (query.genre && !p.genres.some((g) => g.slug === query.genre)) return false;
        if (query.character && !p.characters.some((c) => c.slug === query.character)) return false;
        if (query.tag && !p.tagSlugs.includes(query.tag)) return false;
        if (season !== undefined && p.season !== season) return false;
        if (query.year !== undefined && p.releaseYear !== query.year) return false;
        if (resolution && p.technical.resolution !== resolution) return false;
        if (fps !== undefined && p.technical.fps !== fps) return false;
        if (query.format && p.technical.format !== query.format) return false;
        if (query.size && sizeBucket(p.technical.fileSizeBytes) !== query.size) return false;
        return true;
      });

      let scores: Map<ID, number> | null = null;
      if (parsed && parsed.tokens.length > 0) {
        scores = new Map();
        for (const p of items) {
          const s = scoreDocument(parsed.tokens, scenePackFields(p));
          if (s > 0) scores.set(p.id, s);
        }
        items = items.filter((p) => scores!.has(p.id));
      }

      const sort = query.sort ?? (scores ? undefined : "newest");
      items.sort((a, b) => {
        switch (sort) {
          case "oldest":
            return publishedTime(a) - publishedTime(b);
          case "updated":
            return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
          case "alphabetical":
            return a.title.localeCompare(b.title);
          // No analytics in the sample source — popularity sorts fall back to recency.
          case "views":
          case "downloads":
          case "newest":
            return newestFirst(a, b);
          default:
            return (scores!.get(b.id) ?? 0) - (scores!.get(a.id) ?? 0) || newestFirst(a, b);
        }
      });

      const pageSize = Math.min(Math.max(query.pageSize ?? 12, 1), 48);
      const total = items.length;
      const pageCount = Math.max(1, Math.ceil(total / pageSize));
      const page = Math.min(Math.max(query.page ?? 1, 1), pageCount);
      return { items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, pageCount };
    },

    async getScenePack(slug, options) {
      const pack = scenePacks.find((p) => p.slug === slug);
      if (!pack) return null;
      if (!options?.includeUnpublished && !isPublic(pack)) return null;
      return toView(pack);
    },

    async getScenePacksByIds(ids) {
      const byPackId = new Map(publicPacks().map((p) => [p.id, p]));
      return ids.map((id) => byPackId.get(id)).filter((p): p is ScenePackView => Boolean(p));
    },

    async getFeaturedScenePacks(limit) {
      return publicPacks().filter((p) => p.featured).sort(newestFirst).slice(0, limit);
    },

    async getRecentScenePacks(limit) {
      return publicPacks().sort(newestFirst).slice(0, limit);
    },

    async getSimilarScenePacks(id, limit) {
      const raw = scenePacks.find((p) => p.id === id);
      if (!raw) return [];
      const source = toView(raw);
      return publicPacks()
        .filter((p) => p.id !== id)
        .map((p) => {
          let score = 0;
          if (p.showId === source.showId) score += 4;
          score += p.characterIds.filter((c) => source.characterIds.includes(c)).length * 5;
          score += p.genreIds.filter((g) => source.genreIds.includes(g)).length * 2;
          if (p.channel.id === source.channel.id) score += 1;
          score += p.tagSlugs.filter((t) => source.tagSlugs.includes(t)).length;
          return { p, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score || newestFirst(a.p, b.p))
        .slice(0, limit)
        .map((x) => x.p);
    },

    async getRandomScenePack(excludeIds) {
      const packs = publicPacks();
      if (packs.length === 0) return null;
      const fresh = packs.filter((p) => !excludeIds.includes(p.id));
      const pool = fresh.length > 0 ? fresh : packs;
      return pool[Math.floor(Math.random() * pool.length)];
    },

    async getScenePackFacets(): Promise<ScenePackFacets> {
      const packs = publicPacks();
      return {
        shows: facet(packs.map((p) => [p.show.slug, p.show.title]), "label"),
        characters: facet(packs.flatMap((p) => p.characters.map((c) => [c.slug, c.name] as [string, string])), "label"),
        channels: facet(packs.map((p) => [p.channel.slug, p.channel.name]), "label"),
        genres: facet(packs.flatMap((p) => p.genres.map((g) => [g.slug, g.name] as [string, string])), "label"),
        tags: facet(packs.flatMap((p) => p.tags.map((t) => [t.slug, `#${t.label}`] as [string, string]))),
        seasons: facet(
          packs.filter((p) => p.season !== undefined).map((p) => [String(p.season), `Season ${p.season}`]),
          "label",
        ).sort((a, b) => Number(a.value) - Number(b.value)),
        years: facet(
          packs.filter((p) => p.releaseYear !== undefined).map((p) => [String(p.releaseYear), String(p.releaseYear)]),
          "numeric-desc",
        ),
        resolutions: facet(packs.map((p) => [p.technical.resolution, p.technical.resolution])).sort(
          (a, b) => RESOLUTION_ORDER.indexOf(a.value) - RESOLUTION_ORDER.indexOf(b.value),
        ),
        fps: facet(packs.map((p) => [String(p.technical.fps), `${p.technical.fps} FPS`])).sort(
          (a, b) => Number(a.value) - Number(b.value),
        ),
        formats: facet(packs.map((p) => [p.technical.format, p.technical.format]), "label"),
        sizes: (["small", "medium", "large"] as SizeBucket[])
          .map((b) => ({
            value: b,
            label: SIZE_LABELS[b],
            count: packs.filter((p) => sizeBucket(p.technical.fileSizeBytes) === b).length,
          }))
          .filter((o) => o.count > 0),
      };
    },

    async listShows() {
      const packs = publicPacks();
      return publicShows()
        .map((s) => showSummary(s, packs))
        .sort((a, b) => a.title.localeCompare(b.title));
    },

    async getShow(slug) {
      const show = publicShows().find((s) => s.slug === slug);
      if (!show) return null;
      const packs = publicPacks();
      const own = packs.filter((p) => p.showId === show.id).sort(newestFirst);

      const seasonNumbers = new Set<number | null>(own.map((p) => p.season ?? null));
      const seasons = [...seasonNumbers]
        .sort((a, b) => (a ?? Infinity) - (b ?? Infinity))
        .map((season) => ({
          season,
          year: show.seasons.find((s) => s.number === season)?.year,
          scenePacks: own.filter((p) => (p.season ?? null) === season),
        }));

      const related = publicShows()
        .filter((s) => s.id !== show.id)
        .map((s) => ({
          s,
          score:
            s.genreIds.filter((g) => show.genreIds.includes(g)).length * 2 + (s.channelId === show.channelId ? 1 : 0),
        }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map((x) => showSummary(x.s, packs));

      return {
        show: showSummary(show, packs),
        characters: characters.filter((c) => c.showId === show.id).map((c) => characterSummary(c, packs)),
        seasons,
        related,
      };
    },

    async listCharacters() {
      const packs = publicPacks();
      return characters.map((c) => characterSummary(c, packs)).sort((a, b) => a.name.localeCompare(b.name));
    },

    async getCharacter(slug) {
      const character = characters.find((c) => c.slug === slug);
      if (!character) return null;
      const packs = publicPacks();
      return {
        character: characterSummary(character, packs),
        scenePacks: packs.filter((p) => p.characterIds.includes(character.id)).sort(newestFirst),
        related: characters
          .filter((c) => c.showId === character.showId && c.id !== character.id)
          .map((c) => characterSummary(c, packs)),
      };
    },

    async listChannels() {
      const packs = publicPacks();
      return channels.map((c) => channelSummary(c, packs)).sort((a, b) => a.name.localeCompare(b.name));
    },

    async getChannel(slug) {
      const channel = channels.find((c) => c.slug === slug);
      if (!channel) return null;
      const packs = publicPacks();
      return {
        channel: channelSummary(channel, packs),
        shows: publicShows()
          .filter((s) => s.channelId === channel.id)
          .map((s) => showSummary(s, packs)),
        scenePacks: packs.filter((p) => p.channel.id === channel.id).sort(newestFirst),
      };
    },

    async listGenres() {
      const packs = publicPacks();
      return genres.map((g) => genreSummary(g, packs));
    },

    async getGenre(slug) {
      const genre = genres.find((g) => g.slug === slug);
      if (!genre) return null;
      const packs = publicPacks();
      return {
        genre: genreSummary(genre, packs),
        shows: publicShows()
          .filter((s) => s.genreIds.includes(genre.id))
          .map((s) => showSummary(s, packs)),
        scenePacks: packs.filter((p) => p.genreIds.includes(genre.id)).sort(newestFirst),
      };
    },

    async listPlaylists(options) {
      const packs = publicPacks();
      return publicPlaylists()
        .filter((p) => (options?.featured ? p.featured : true))
        .map((p) => playlistSummary(p, packs));
    },

    async getPlaylist(slug) {
      const playlist = playlists.find((p) => p.slug === slug && p.visibility !== "private");
      if (!playlist) return null;
      const summary = playlistSummary(playlist, publicPacks());
      const byPackId = new Map(publicPacks().map((p) => [p.id, p]));
      return {
        playlist: summary,
        scenePacks: playlist.scenePackIds.map((id) => byPackId.get(id)).filter((p): p is ScenePackView => Boolean(p)),
      };
    },

    async listCollections(options) {
      return collections.filter((c) => (options?.featured ? c.featured : true)).map(collectionSummary);
    },

    async getCollection(slug) {
      const collection = collections.find((c) => c.slug === slug);
      if (!collection) return null;
      const packs = publicPacks();
      const byPackId = new Map(packs.map((p) => [p.id, p]));
      const ids = (type: string) => collection.items.filter((i) => i.type === type).map((i) => i.id);
      return {
        collection: collectionSummary(collection),
        shows: ids("show")
          .map((id) => showsById.get(id))
          .filter((s): s is Show => Boolean(s) && s!.status === "published")
          .map((s) => showSummary(s, packs)),
        playlists: ids("playlist")
          .map((id) => playlistsById.get(id))
          .filter((p): p is Playlist => Boolean(p) && p!.visibility === "public")
          .map((p) => playlistSummary(p, packs)),
        scenePacks: ids("scenepack")
          .map((id) => byPackId.get(id))
          .filter((p): p is ScenePackView => Boolean(p)),
      };
    },

    async getTag(slug) {
      return tagsBySlug.get(slug) ?? null;
    },

    async listRequests(query: RequestQuery) {
      const packs = publicPacks();
      const tokens = query.q ? tokenize(query.q) : [];
      let items = requests.filter((r) => {
        if (query.status && r.status !== query.status) return false;
        if (query.channel && channelsById.get(r.channelId ?? "")?.slug !== query.channel) return false;
        if (query.genre && genresById.get(r.genreId ?? "")?.slug !== query.genre) return false;
        switch (query.tab) {
          case "popular":
            if (!OPEN_STATUSES.has(r.status)) return false;
            break;
          case "planned":
            if (r.status !== "planned") return false;
            break;
          case "in_progress":
            if (r.status !== "in_progress") return false;
            break;
          case "completed":
            if (r.status !== "completed" && r.status !== "published") return false;
            break;
        }
        if (tokens.length > 0) {
          const score = scoreDocument(tokens, [
            { text: r.title, weight: 3 },
            { text: r.showTitle, weight: 3 },
            { text: r.characterName ?? "", weight: 3 },
            { text: r.description, weight: 1 },
          ]);
          if (score === 0) return false;
        }
        return true;
      });

      const now = Date.now();
      items =
        query.tab === "new"
          ? items.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
          : query.tab === "completed"
            ? items.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
            : items.sort((a, b) => demandScore(b, now) - demandScore(a, now));

      return items.slice(0, query.limit ?? 50).map((r) => requestView(r, packs));
    },

    async getRequest(id) {
      const r = requests.find((x) => x.id === id);
      return r ? requestView(r, publicPacks()) : null;
    },

    async search(query, options): Promise<SearchResults> {
      const limit = options?.limitPerType ?? 12;
      const parsed = parseSearchQuery(query);
      const empty: SearchResults = {
        query,
        parsed,
        scenePacks: [],
        shows: [],
        characters: [],
        channels: [],
        genres: [],
        playlists: [],
        collections: [],
        tags: [],
        total: 0,
      };
      const hasStructured = parsed.resolution || parsed.fps || parsed.season;
      if (parsed.tokens.length === 0 && !hasStructured) return empty;

      const packs = publicPacks();
      const rank = <T>(items: T[], fields: (item: T) => WeightedField[]) =>
        parsed.tokens.length === 0
          ? []
          : items
              .map((item) => ({ item, score: scoreDocument(parsed.tokens, fields(item)) }))
              .filter((x) => x.score > 0)
              .sort((a, b) => b.score - a.score)
              .slice(0, limit)
              .map((x) => x.item);

      const packResults = await this.listScenePacks({ q: query, pageSize: limit });

      const results: SearchResults = {
        ...empty,
        scenePacks: packResults.items,
        shows: rank(publicShows(), (s) => [
          { text: s.title, weight: 5 },
          { text: s.aliases.join(" "), weight: 4 },
          { text: channelsById.get(s.channelId)!.name, weight: 1 },
        ]).map((s) => showSummary(s, packs)),
        characters: rank(characters, (c) => [
          { text: c.name, weight: 5 },
          { text: c.aliases.join(" "), weight: 4 },
          { text: c.actor ?? "", weight: 2 },
          { text: showsById.get(c.showId)!.title, weight: 1 },
        ]).map((c) => characterSummary(c, packs)),
        channels: rank(channels, (c) => [{ text: c.name, weight: 5 }]).map((c) => channelSummary(c, packs)),
        genres: rank(genres, (g) => [{ text: g.name, weight: 5 }]).map((g) => genreSummary(g, packs)),
        playlists: rank(publicPlaylists(), (p) => [
          { text: p.title, weight: 5 },
          { text: p.description, weight: 1 },
        ]).map((p) => playlistSummary(p, packs)),
        collections: rank(collections, (c) => [
          { text: c.title, weight: 5 },
          { text: c.description, weight: 1 },
        ]).map(collectionSummary),
        tags: rank(tags, (t) => [{ text: t.label, weight: 5 }]),
      };
      results.total =
        packResults.total +
        results.shows.length +
        results.characters.length +
        results.channels.length +
        results.genres.length +
        results.playlists.length +
        results.collections.length;
      return results;
    },

    async suggest(query, limit) {
      if (normalize(query).length < 1) return [];
      const r = await this.search(query, { limitPerType: 4 });
      const out: SearchSuggestion[] = [
        ...r.shows.map((s) => ({
          type: "show" as const,
          label: s.title,
          sublabel: `Show · ${s.channel.name}`,
          href: `/shows/${s.slug}`,
        })),
        ...r.characters.map((c) => ({
          type: "character" as const,
          label: c.name,
          sublabel: `Character · ${c.show.title}`,
          href: `/characters/${c.slug}`,
        })),
        ...r.scenePacks.map((p) => ({
          type: "scenepack" as const,
          label: p.title,
          sublabel: `ScenePack · ${p.technical.resolution} · ${p.technical.fps} FPS`,
          href: `/scenepacks/${p.slug}`,
        })),
        ...r.channels.map((c) => ({ type: "channel" as const, label: c.name, sublabel: "Channel", href: `/channels/${c.slug}` })),
        ...r.genres.map((g) => ({ type: "genre" as const, label: g.name, sublabel: "Genre", href: `/genres/${g.slug}` })),
        ...r.playlists.map((p) => ({ type: "playlist" as const, label: p.title, sublabel: "Playlist", href: `/playlists/${p.slug}` })),
        ...r.collections.map((c) => ({
          type: "collection" as const,
          label: c.title,
          sublabel: "Collection",
          href: `/collections/${c.slug}`,
        })),
        ...r.tags.map((t) => ({ type: "tag" as const, label: `#${t.label}`, sublabel: "Tag", href: `/scenepacks?tag=${t.slug}` })),
      ];
      return out.slice(0, limit);
    },

    async getActiveAnnouncements() {
      const now = Date.now();
      return announcements.filter(
        (a) =>
          a.active &&
          (!a.startsAt || Date.parse(a.startsAt) <= now) &&
          (!a.endsAt || Date.parse(a.endsAt) > now),
      );
    },

    async getChangelog() {
      return [...changelog].sort((a, b) => b.date.localeCompare(a.date));
    },

    async getSiteCounts() {
      return {
        scenePacks: publicPacks().length,
        shows: publicShows().length,
        characters: characters.length,
        channels: channels.length,
      };
    },

    createReport(report) {
      return hooks.createReport(report);
    },
  };
}
