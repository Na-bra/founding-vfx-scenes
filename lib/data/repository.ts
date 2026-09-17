/**
 * The content repository contract.
 *
 * Pages and API routes depend only on this interface. The sample
 * implementation backs development; a PostgreSQL implementation (see
 * `prisma/schema.prisma`) will satisfy the same contract so no UI code
 * changes when the database is connected.
 */
import type {
  Announcement,
  ChangelogEntry,
  Channel,
  Character,
  Collection,
  Genre,
  ID,
  Paginated,
  Playlist,
  ReportReason,
  Resolution,
  RequestStatus,
  SceneRequest,
  ScenePackView,
  Show,
  Tag,
} from "@/types/content";
import type { ParsedQuery } from "@/lib/search/query-parser";

export const SCENEPACK_SORTS = ["newest", "oldest", "updated", "alphabetical", "views", "downloads"] as const;
export type ScenePackSort = (typeof SCENEPACK_SORTS)[number];

export const SIZE_BUCKETS = ["small", "medium", "large"] as const;
export type SizeBucket = (typeof SIZE_BUCKETS)[number];

export type ScenePackQuery = {
  q?: string;
  show?: string;
  character?: string;
  channel?: string;
  genre?: string;
  tag?: string;
  season?: number;
  year?: number;
  resolution?: Resolution;
  fps?: number;
  format?: string;
  size?: SizeBucket;
  sort?: ScenePackSort;
  page?: number;
  pageSize?: number;
};

export type FacetOption = { value: string; label: string; count: number };

export type ScenePackFacets = {
  shows: FacetOption[];
  characters: FacetOption[];
  channels: FacetOption[];
  genres: FacetOption[];
  tags: FacetOption[];
  seasons: FacetOption[];
  years: FacetOption[];
  resolutions: FacetOption[];
  fps: FacetOption[];
  formats: FacetOption[];
  sizes: FacetOption[];
};

export type ShowSummary = Show & {
  channel: Pick<Channel, "id" | "slug" | "name">;
  genres: Pick<Genre, "id" | "slug" | "name">[];
  scenePackCount: number;
};

export type ShowDetail = {
  show: ShowSummary;
  characters: CharacterSummary[];
  seasons: { season: number | null; year?: number; scenePacks: ScenePackView[] }[];
  related: ShowSummary[];
};

export type CharacterSummary = Character & {
  show: Pick<Show, "id" | "slug" | "title">;
  scenePackCount: number;
};

export type CharacterDetail = {
  character: CharacterSummary;
  scenePacks: ScenePackView[];
  related: CharacterSummary[];
};

export type ChannelSummary = Channel & { showCount: number; scenePackCount: number };
export type ChannelDetail = { channel: ChannelSummary; shows: ShowSummary[]; scenePacks: ScenePackView[] };

export type GenreSummary = Genre & { showCount: number; scenePackCount: number };
export type GenreDetail = { genre: GenreSummary; shows: ShowSummary[]; scenePacks: ScenePackView[] };

export type PlaylistSummary = Playlist & { scenePackCount: number; coverPacks: ScenePackView[] };
export type PlaylistDetail = { playlist: PlaylistSummary; scenePacks: ScenePackView[] };

export type CollectionSummary = Collection & { itemCount: number };
export type CollectionDetail = {
  collection: CollectionSummary;
  shows: ShowSummary[];
  playlists: PlaylistSummary[];
  scenePacks: ScenePackView[];
};

export const REQUEST_TABS = ["popular", "new", "planned", "in_progress", "completed"] as const;
export type RequestTab = (typeof REQUEST_TABS)[number];

export type RequestQuery = {
  tab?: RequestTab;
  status?: RequestStatus;
  channel?: string;
  genre?: string;
  q?: string;
  limit?: number;
};

export type RequestView = SceneRequest & {
  show?: Pick<Show, "id" | "slug" | "title">;
  genre?: Pick<Genre, "id" | "slug" | "name">;
  channel?: Pick<Channel, "id" | "slug" | "name">;
  fulfilledBy?: Pick<ScenePackView, "id" | "slug" | "title">;
};

export type SearchResults = {
  query: string;
  parsed: ParsedQuery;
  scenePacks: ScenePackView[];
  shows: ShowSummary[];
  characters: CharacterSummary[];
  channels: ChannelSummary[];
  genres: GenreSummary[];
  playlists: PlaylistSummary[];
  collections: CollectionSummary[];
  tags: Tag[];
  total: number;
};

export type SuggestionType = "scenepack" | "show" | "character" | "channel" | "genre" | "playlist" | "collection" | "tag";
export type SearchSuggestion = { type: SuggestionType; label: string; sublabel?: string; href: string };

export type SiteCounts = { scenePacks: number; shows: number; characters: number; channels: number };

export type NewReport = { scenePackId: ID; reason: ReportReason; details?: string };

export interface ContentRepository {
  readonly source: "sample" | "database";

  listScenePacks(query: ScenePackQuery): Promise<Paginated<ScenePackView>>;
  getScenePack(slug: string, options?: { includeUnpublished?: boolean }): Promise<ScenePackView | null>;
  getScenePacksByIds(ids: ID[]): Promise<ScenePackView[]>;
  getFeaturedScenePacks(limit: number): Promise<ScenePackView[]>;
  getRecentScenePacks(limit: number): Promise<ScenePackView[]>;
  getSimilarScenePacks(id: ID, limit: number): Promise<ScenePackView[]>;
  getRandomScenePack(excludeIds: ID[]): Promise<ScenePackView | null>;
  getScenePackFacets(): Promise<ScenePackFacets>;

  listShows(): Promise<ShowSummary[]>;
  getShow(slug: string): Promise<ShowDetail | null>;
  listCharacters(): Promise<CharacterSummary[]>;
  getCharacter(slug: string): Promise<CharacterDetail | null>;
  listChannels(): Promise<ChannelSummary[]>;
  getChannel(slug: string): Promise<ChannelDetail | null>;
  listGenres(): Promise<GenreSummary[]>;
  getGenre(slug: string): Promise<GenreDetail | null>;
  listPlaylists(options?: { featured?: boolean }): Promise<PlaylistSummary[]>;
  getPlaylist(slug: string): Promise<PlaylistDetail | null>;
  listCollections(options?: { featured?: boolean }): Promise<CollectionSummary[]>;
  getCollection(slug: string): Promise<CollectionDetail | null>;
  getTag(slug: string): Promise<Tag | null>;

  listRequests(query: RequestQuery): Promise<RequestView[]>;
  getRequest(id: ID): Promise<RequestView | null>;

  search(query: string, options?: { limitPerType?: number }): Promise<SearchResults>;
  suggest(query: string, limit: number): Promise<SearchSuggestion[]>;

  getActiveAnnouncements(): Promise<Announcement[]>;
  getChangelog(): Promise<ChangelogEntry[]>;
  getSiteCounts(): Promise<SiteCounts>;

  createReport(report: NewReport): Promise<{ id: ID }>;
}
