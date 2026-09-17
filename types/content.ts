/**
 * Domain types for FoundingVFX content.
 *
 * These are the shapes the UI consumes. They intentionally exclude storage
 * details (provider credentials, object ids, raw download URLs) — those live
 * in `types/storage.ts` and are only ever read by server-side services.
 */

export type ID = string;

export type PublishStatus = "draft" | "scheduled" | "published" | "unpublished";

export type ImageAsset = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

export type Channel = {
  id: ID;
  slug: string;
  name: string;
  description: string;
  artwork?: ImageAsset;
};

export type Genre = {
  id: ID;
  slug: string;
  name: string;
  description: string;
  artwork?: ImageAsset;
};

export type Tag = {
  slug: string;
  label: string;
};

export type ShowFormat = "series" | "film" | "special";

export type Season = {
  number: number;
  year?: number;
  episodeCount?: number;
};

export type Show = {
  id: ID;
  slug: string;
  title: string;
  aliases: string[];
  format: ShowFormat;
  description: string;
  channelId: ID;
  genreIds: ID[];
  yearStart: number;
  /** `null` means the show is still running. */
  yearEnd: number | null;
  seasons: Season[];
  poster?: ImageAsset;
  banner?: ImageAsset;
  status: PublishStatus;
};

export type Character = {
  id: ID;
  slug: string;
  name: string;
  aliases: string[];
  showId: ID;
  actor?: string;
  description: string;
  artwork?: ImageAsset;
};

export type Resolution = "720p" | "1080p" | "1440p" | "4K";

export type TechnicalSpec = {
  resolution: Resolution;
  fps: number;
  format: string;
  fileSizeBytes: number;
  clipCount: number;
  aspectRatio?: string;
  /** `undefined` means unknown — don't display. */
  hasAudio?: boolean;
};

/** Optional editing facts. Only facts that are actually known should be set. */
export type EditingInfo = {
  raw?: boolean;
  clean?: boolean;
  colorGraded?: boolean;
  upscaled?: boolean;
  watermark?: boolean;
};

export type PreviewMedia =
  | { kind: "image"; image: ImageAsset }
  | { kind: "video"; src: string; poster?: ImageAsset; durationSeconds?: number };

export type ScenePack = {
  id: ID;
  slug: string;
  title: string;
  description: string;
  showId: ID;
  characterIds: ID[];
  genreIds: ID[];
  tagSlugs: string[];
  season?: number;
  episode?: number;
  episodeTitle?: string;
  releaseYear?: number;
  thumbnail?: ImageAsset;
  previews: PreviewMedia[];
  technical: TechnicalSpec;
  editing: EditingInfo;
  version: string;
  status: PublishStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

/** A ScenePack joined with the records it references, ready for display. */
export type ScenePackView = ScenePack & {
  show: Pick<Show, "id" | "slug" | "title" | "yearStart" | "yearEnd">;
  channel: Pick<Channel, "id" | "slug" | "name">;
  characters: Pick<Character, "id" | "slug" | "name">[];
  genres: Pick<Genre, "id" | "slug" | "name">[];
  tags: Tag[];
};

export type Visibility = "public" | "unlisted" | "private";

export type Playlist = {
  id: ID;
  slug: string;
  title: string;
  description: string;
  thumbnail?: ImageAsset;
  /** Ordered ScenePack ids. */
  scenePackIds: ID[];
  visibility: Visibility;
  featured: boolean;
  updatedAt: string;
};

export type CollectionItem =
  | { type: "show"; id: ID }
  | { type: "scenepack"; id: ID }
  | { type: "playlist"; id: ID };

export type Collection = {
  id: ID;
  slug: string;
  title: string;
  description: string;
  artwork?: ImageAsset;
  items: CollectionItem[];
  featured: boolean;
  updatedAt: string;
};

export type RequestStatus =
  | "pending"
  | "under_review"
  | "planned"
  | "in_progress"
  | "completed"
  | "published"
  | "declined";

export type SceneRequest = {
  id: ID;
  title: string;
  showTitle: string;
  showId?: ID;
  characterName?: string;
  description: string;
  year?: number;
  genreId?: ID;
  channelId?: ID;
  season?: number;
  episode?: number;
  preferredResolution?: Resolution;
  preferredFps?: number;
  status: RequestStatus;
  voteCount: number;
  highPriority: boolean;
  /** Set once the request has been fulfilled by a published ScenePack. */
  fulfilledByScenePackId?: ID;
  createdAt: string;
  updatedAt: string;
};

export type Announcement = {
  id: ID;
  message: string;
  href?: string;
  tone: "info" | "success" | "warning";
  active: boolean;
  startsAt?: string;
  endsAt?: string;
};

export type ChangelogEntry = {
  id: ID;
  date: string;
  title: string;
  changes: string[];
};

export type ReportReason =
  | "broken_download"
  | "incorrect_information"
  | "incorrect_thumbnail"
  | "duplicate"
  | "other";

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};
