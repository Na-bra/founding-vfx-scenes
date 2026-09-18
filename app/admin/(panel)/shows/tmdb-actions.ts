"use server";

import { authorize } from "@/lib/admin/auth";
import { audit } from "@/lib/admin/audit";
import { contentChanged } from "@/lib/admin/content";
import { actionError, slugify } from "@/lib/admin/forms";
import type { FormState } from "@/lib/admin/form-state";
import { importImageFromUrl } from "@/lib/admin/upload";
import { getDb } from "@/lib/db";
import { rateLimit } from "@/lib/server/rate-limit";
import { getTmdbDetails, isTmdbConfigured, searchTmdb, TMDB_IMAGE_HOST, type TmdbSearchResult } from "@/services/metadata/tmdb";

export type SearchState = { results?: TmdbSearchResult[]; message?: string };

export async function searchShowMetadata(_: SearchState, formData: FormData): Promise<SearchState> {
  try {
    const admin = await authorize("catalog.write");
    if (!isTmdbConfigured()) return { message: "Set TMDB_API_KEY in .env to import show details." };

    const query = String(formData.get("query") ?? "").trim().slice(0, 100);
    if (query.length < 2) return { message: "Type at least two characters." };

    // TMDB allows ~50 requests/second; this is a per-admin courtesy limit.
    if (!rateLimit(`tmdb:${admin.id}`, 40, 60_000).ok) return { message: "Too many searches — wait a moment." };

    const results = await searchShowMetadataInternal(query);
    return results.length ? { results } : { message: `Nothing found for “${query}”.` };
  } catch (error) {
    console.error("[admin] TMDB search failed", error);
    return { message: "Couldn't reach TMDB. Try again." };
  }
}

async function searchShowMetadataInternal(query: string) {
  return searchTmdb(query);
}

/** Creates characters from a show's TMDB cast. Skips names that already exist. */
export async function importCast(showId: string, _: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("catalog.write");
    const names = formData.getAll("cast").map(String);
    if (names.length === 0) return { message: "Select at least one character." };

    const db = getDb();
    const show = await db.show.findUnique({ where: { id: showId }, include: { characters: true } });
    if (!show?.tmdbId || !show.tmdbType) return { message: "This show isn't linked to TMDB." };

    const details = await getTmdbDetails(show.tmdbId, show.tmdbType === "movie" ? "movie" : "tv");
    const existing = new Set(show.characters.map((c) => c.name.toLowerCase()));
    const chosen = details.cast.filter((c) => names.includes(`${c.name}|${c.actor}`) && !existing.has(c.name.toLowerCase()));
    if (chosen.length === 0) return { message: "Those characters already exist." };

    let created = 0;
    for (const member of chosen) {
      const base = slugify(member.name) || slugify(`${show.title}-${member.actor}`);
      let slug = base;
      for (let i = 2; await db.character.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;
      const artworkUrl = member.profileUrl ? await importImageFromUrl(member.profileUrl, "characters", [TMDB_IMAGE_HOST]) : undefined;
      await db.character.create({ data: { name: member.name, slug, showId, actor: member.actor, description: "", artworkUrl: artworkUrl ?? null } });
      created++;
    }

    await audit(admin, "character.import", { type: "show", id: showId, label: show.title }, { imported: { to: created } });
    contentChanged();
    return { ok: true, message: `Added ${created} character${created === 1 ? "" : "s"} from TMDB.` };
  } catch (error) {
    return actionError(error, "cast import");
  }
}
