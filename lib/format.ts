const UNITS = ["B", "KB", "MB", "GB", "TB"];

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const value = bytes / 1024 ** exp;
  return `${value >= 10 || exp === 0 ? Math.round(value) : value.toFixed(1)} ${UNITS[exp]}`;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

/** Formatted in UTC so server and client render identical text. */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatMonth(iso: string): string {
  return monthFormatter.format(new Date(iso));
}

export function formatYears(start: number, end: number | null): string {
  if (end === null) return `${start}–present`;
  return start === end ? String(start) : `${start}–${end}`;
}

export function formatCount(n: number, singular: string, plural = `${singular}s`): string {
  return `${n.toLocaleString("en-US")} ${n === 1 ? singular : plural}`;
}

export function formatSeasonEpisode(season?: number, episode?: number): string | null {
  if (season === undefined) return null;
  return episode === undefined ? `Season ${season}` : `S${season} · E${episode}`;
}

/** Deterministic 32-bit hash for stable generated artwork. */
export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
