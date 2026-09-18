import "server-only";

/**
 * TMDB lookup used by the admin "Import from TMDB" flow.
 *
 * Nothing imported here is published automatically — it prefills the show form
 * for an admin to review and save, as the spec requires.
 *
 * Attribution: this product uses the TMDB API but is not endorsed or certified
 * by TMDB.
 */

const API = "https://api.themoviedb.org/3";
const IMAGE = "https://image.tmdb.org/t/p";

export type TmdbMediaType = "tv" | "movie";

export type TmdbSearchResult = {
  id: number;
  mediaType: TmdbMediaType;
  title: string;
  year: number | null;
  overview: string;
  posterUrl: string | null;
};

export type TmdbCastMember = { name: string; actor: string; profileUrl: string | null };

export type TmdbShowDetails = {
  id: number;
  mediaType: TmdbMediaType;
  title: string;
  aliases: string[];
  description: string;
  yearStart: number | null;
  yearEnd: number | null;
  /** Still running (TV only). */
  ongoing: boolean;
  genres: string[];
  network: string | null;
  seasons: { number: number; year: number | null; episodeCount: number | null }[];
  posterUrl: string | null;
  bannerUrl: string | null;
  cast: TmdbCastMember[];
};

export function isTmdbConfigured() {
  return Boolean(process.env.TMDB_API_KEY);
}

/** Only these hosts may be fetched when importing artwork. */
export const TMDB_IMAGE_HOST = "image.tmdb.org";

function image(path: string | null | undefined, size: "w185" | "w500" | "original" = "w500") {
  return path ? `${IMAGE}/${size}${path}` : null;
}

const year = (date: string | null | undefined) => (date && /^\d{4}/.test(date) ? Number(date.slice(0, 4)) : null);

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY is not set");

  const url = new URL(`${API}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  // v4 read tokens are JWTs and go in the Authorization header; v3 keys go in the query.
  const isBearer = key.startsWith("ey");
  if (!isBearer) url.searchParams.set("api_key", key);

  const response = await fetch(url, {
    headers: { accept: "application/json", ...(isBearer && { authorization: `Bearer ${key}` }) },
    signal: AbortSignal.timeout(10_000),
    // TMDB data changes rarely; cache briefly to stay well inside rate limits.
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw new Error(`TMDB ${path} failed (${response.status})`);
  return response.json() as Promise<T>;
}

type SearchResponse = {
  results: {
    id: number;
    media_type?: string;
    name?: string;
    title?: string;
    first_air_date?: string;
    release_date?: string;
    overview?: string;
    poster_path?: string | null;
  }[];
};

export async function searchTmdb(query: string): Promise<TmdbSearchResult[]> {
  const data = await tmdb<SearchResponse>("/search/multi", { query, include_adult: "false" });
  return data.results
    .filter((r) => r.media_type === "tv" || r.media_type === "movie")
    .slice(0, 8)
    .map((r) => ({
      id: r.id,
      mediaType: r.media_type as TmdbMediaType,
      title: r.name ?? r.title ?? "Untitled",
      year: year(r.first_air_date ?? r.release_date),
      overview: r.overview ?? "",
      posterUrl: image(r.poster_path, "w185"),
    }));
}

type DetailsResponse = {
  id: number;
  name?: string;
  title?: string;
  overview?: string;
  first_air_date?: string;
  last_air_date?: string;
  release_date?: string;
  in_production?: boolean;
  status?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genres?: { name: string }[];
  networks?: { name: string }[];
  production_companies?: { name: string }[];
  seasons?: { season_number: number; air_date?: string | null; episode_count?: number }[];
  alternative_titles?: { results?: { title: string }[]; titles?: { title: string }[] };
  aggregate_credits?: { cast?: { name: string; profile_path?: string | null; roles?: { character: string }[] }[] };
  credits?: { cast?: { name: string; character?: string; profile_path?: string | null }[] };
};

export async function getTmdbDetails(id: number, mediaType: TmdbMediaType): Promise<TmdbShowDetails> {
  const append = mediaType === "tv" ? "alternative_titles,aggregate_credits" : "alternative_titles,credits";
  const d = await tmdb<DetailsResponse>(`/${mediaType}/${id}`, { append_to_response: append });

  const ongoing = mediaType === "tv" && (d.in_production === true || d.status === "Returning Series");
  const start = year(d.first_air_date ?? d.release_date);
  const end = mediaType === "tv" ? (ongoing ? null : year(d.last_air_date)) : start;

  const cast: TmdbCastMember[] =
    mediaType === "tv"
      ? (d.aggregate_credits?.cast ?? []).slice(0, 25).map((c) => ({
          name: c.roles?.[0]?.character?.split("/")[0].trim() || c.name,
          actor: c.name,
          profileUrl: image(c.profile_path),
        }))
      : (d.credits?.cast ?? []).slice(0, 25).map((c) => ({
          name: c.character?.split("/")[0].trim() || c.name,
          actor: c.name,
          profileUrl: image(c.profile_path),
        }));

  const altTitles = (d.alternative_titles?.results ?? d.alternative_titles?.titles ?? []).map((t) => t.title);

  return {
    id: d.id,
    mediaType,
    title: d.name ?? d.title ?? "Untitled",
    aliases: [...new Set(altTitles)].filter((t) => t.toLowerCase() !== (d.name ?? d.title ?? "").toLowerCase()).slice(0, 6),
    description: d.overview ?? "",
    yearStart: start,
    yearEnd: end,
    ongoing,
    genres: (d.genres ?? []).map((g) => g.name),
    network: d.networks?.[0]?.name ?? d.production_companies?.[0]?.name ?? null,
    seasons: (d.seasons ?? [])
      .filter((s) => s.season_number > 0)
      .map((s) => ({ number: s.season_number, year: year(s.air_date), episodeCount: s.episode_count ?? null })),
    posterUrl: image(d.poster_path, "original"),
    bannerUrl: image(d.backdrop_path, "original"),
    cast: cast.filter((c) => c.name),
  };
}
