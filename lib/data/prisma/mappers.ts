import type { Resolution } from "@/types/content";
import type { Resolution as DbResolution } from "@/generated/prisma/enums";

/** Prisma enum names can't start with a digit, so resolutions are mapped. */
const FROM_DB: Record<DbResolution, Resolution> = { r720p: "720p", r1080p: "1080p", r1440p: "1440p", r4k: "4K" };
const TO_DB = Object.fromEntries(Object.entries(FROM_DB).map(([k, v]) => [v, k])) as Record<Resolution, DbResolution>;

export const resolutionFromDb = (r: DbResolution): Resolution => FROM_DB[r];
export const resolutionToDb = (r: Resolution): DbResolution => TO_DB[r];

export const iso = (d: Date) => d.toISOString();
export const isoOrNull = (d: Date | null) => (d ? d.toISOString() : null);
export const orUndefined = <T>(v: T | null): T | undefined => (v === null ? undefined : v);

export function image(src: string | null, alt: string | null | undefined, fallbackAlt: string) {
  return src ? { src, alt: alt || fallbackAlt } : undefined;
}

/** Date column (no time) → YYYY-MM-DD */
export const dateOnly = (d: Date) => d.toISOString().slice(0, 10);
