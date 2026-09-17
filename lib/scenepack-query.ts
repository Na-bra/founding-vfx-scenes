import { z } from "zod";
import { SCENEPACK_SORTS, SIZE_BUCKETS, type ScenePackQuery } from "@/lib/data/repository";

const slug = z.string().trim().max(80).regex(/^[a-z0-9-]+$/);
const intFrom = (min: number, max: number) => z.coerce.number().int().min(min).max(max);

const schema = z.object({
  q: z.string().trim().max(120).optional(),
  show: slug.optional(),
  character: slug.optional(),
  channel: slug.optional(),
  genre: slug.optional(),
  tag: slug.optional(),
  season: intFrom(0, 99).optional(),
  year: intFrom(1900, 2100).optional(),
  resolution: z.enum(["720p", "1080p", "1440p", "4K"]).optional(),
  fps: intFrom(1, 240).optional(),
  format: z.string().trim().max(60).optional(),
  size: z.enum(SIZE_BUCKETS).optional(),
  sort: z.enum(SCENEPACK_SORTS).optional(),
  page: intFrom(1, 10_000).optional(),
});

export const FILTER_KEYS = ["show", "character", "channel", "genre", "tag", "season", "year", "resolution", "fps", "format", "size"] as const;

/**
 * Parse ScenePack filters from URL params. Invalid values are dropped
 * individually rather than rejecting the whole query, so a mangled link still
 * shows useful results.
 */
export function parseScenePackQuery(input: URLSearchParams | Record<string, string | string[] | undefined>): ScenePackQuery {
  const entries =
    input instanceof URLSearchParams
      ? Object.fromEntries(input.entries())
      : Object.fromEntries(Object.entries(input).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));

  const out: Record<string, unknown> = {};
  for (const key of Object.keys(schema.shape) as (keyof typeof schema.shape)[]) {
    const raw = entries[key];
    if (raw === undefined || raw === "") continue;
    const parsed = schema.shape[key].safeParse(raw);
    if (parsed.success && parsed.data !== undefined) out[key] = parsed.data;
  }
  return out as ScenePackQuery;
}
