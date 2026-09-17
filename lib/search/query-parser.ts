import type { Resolution } from "@/types/content";
import { tokenize } from "./text";

/**
 * Rule-based extraction of structured filters from a free-text query.
 *
 *   "1080p Henry Danger Max 60fps"  →  text "henry danger max", resolution 1080p, fps 60
 *
 * This is deliberately deterministic. A future natural-language search service
 * can replace `parseSearchQuery` behind the same return type.
 */

export type ParsedQuery = {
  text: string;
  tokens: string[];
  resolution?: Resolution;
  fps?: number;
  season?: number;
  episode?: number;
};

const RESOLUTIONS: Record<string, Resolution> = {
  "720p": "720p",
  "720": "720p",
  hd: "720p",
  "1080p": "1080p",
  "1080": "1080p",
  fhd: "1080p",
  "1440p": "1440p",
  "1440": "1440p",
  "2k": "1440p",
  "4k": "4K",
  "2160p": "4K",
  uhd: "4K",
};

export function parseSearchQuery(raw: string): ParsedQuery {
  const input = tokenize(raw);
  const tokens: string[] = [];
  const parsed: Omit<ParsedQuery, "text" | "tokens"> = {};

  for (let i = 0; i < input.length; i++) {
    const t = input[i];
    const next = input[i + 1];

    if (RESOLUTIONS[t]) {
      parsed.resolution = RESOLUTIONS[t];
      continue;
    }

    const fps = /^(\d{2,3})fps$/.exec(t);
    if (fps) {
      parsed.fps = Number(fps[1]);
      continue;
    }
    if (/^\d{2,3}$/.test(t) && next === "fps") {
      parsed.fps = Number(t);
      i++;
      continue;
    }

    const se = /^s(\d{1,2})(?:e(\d{1,3}))?$/.exec(t);
    if (se) {
      parsed.season = Number(se[1]);
      if (se[2]) parsed.episode = Number(se[2]);
      continue;
    }
    if (t === "season" && next && /^\d{1,2}$/.test(next)) {
      parsed.season = Number(next);
      i++;
      continue;
    }
    if ((t === "episode" || t === "ep") && next && /^\d{1,3}$/.test(next)) {
      parsed.episode = Number(next);
      i++;
      continue;
    }

    tokens.push(t);
  }

  return { ...parsed, tokens, text: tokens.join(" ") };
}
