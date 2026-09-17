"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { authorize } from "@/lib/admin/auth";
import { audit, diff } from "@/lib/admin/audit";
import { contentChanged } from "@/lib/admin/content";
import { actionError, f, isNavigationError, parseForm, slugify } from "@/lib/admin/forms";
import type { FormState } from "@/lib/admin/form-state";
import { deleteStoredImage, resolveImageField } from "@/lib/admin/upload";

/* ---------------- Tags ---------------- */

const tagSchema = z.object({ label: f.text(40), slug: f.slug() });

export async function createTag(_: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("catalog.write");
    const parsed = parseForm(tagSchema, formData);
    if (!parsed.ok) return parsed.state;
    const label = parsed.data.label.replace(/^#/, "").toLowerCase();
    const slug = parsed.data.slug ?? slugify(label);
    if (!slug) return { message: "Enter a tag name.", errors: { label: "Required" } };
    await getDb().tag.create({ data: { slug, label } });
    await audit(admin, "tag.create", { type: "tag", id: slug, label });
    contentChanged();
    return { ok: true, message: `Added #${label}.` };
  } catch (error) {
    return actionError(error, "tag");
  }
}

export async function deleteTag(_: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("catalog.delete");
    const slug = String(formData.get("slug"));
    await getDb().tag.delete({ where: { slug } });
    await audit(admin, "tag.delete", { type: "tag", id: slug, label: slug });
    contentChanged();
    redirect("/admin/tags");
  } catch (error) {
    if (isNavigationError(error)) throw error;
    return actionError(error, "tag");
  }
}

/* ---------------- Characters ---------------- */

const characterSchema = z.object({
  name: f.text(120),
  slug: f.slug(),
  showId: z.string().min(1, "Choose a show"),
  aliases: f.list(),
  actor: f.optText(120),
  description: f.optText(1000),
});

export async function saveCharacter(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("catalog.write");
    const parsed = parseForm(characterSchema, formData);
    if (!parsed.ok) return parsed.state;
    const { name, showId, aliases, actor, description } = parsed.data;
    const db = getDb();
    const data = { name, slug: parsed.data.slug ?? slugify(name), showId, aliases, actor: actor ?? null, description: description ?? "" };

    if (id) {
      const before = await db.character.findUnique({ where: { id } });
      if (!before) return { message: "This character no longer exists." };
      const artworkUrl = await resolveImageField(formData, "artwork", "characters", before.artworkUrl);
      const update = { ...data, ...(artworkUrl !== undefined && { artworkUrl }) };
      await db.character.update({ where: { id }, data: update });
      await audit(admin, "character.update", { type: "character", id, label: name }, diff(before, update));
      contentChanged();
      return { ok: true, message: "Saved." };
    }

    const artworkUrl = (await resolveImageField(formData, "artwork", "characters", null)) ?? null;
    const created = await db.character.create({ data: { ...data, artworkUrl } });
    await audit(admin, "character.create", { type: "character", id: created.id, label: name });
    contentChanged();
    redirect(`/admin/characters/${created.id}?created=1`);
  } catch (error) {
    if (isNavigationError(error)) throw error;
    return actionError(error, "character");
  }
}

export async function deleteCharacter(_: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("catalog.delete");
    const id = String(formData.get("id"));
    const before = await getDb().character.delete({ where: { id } });
    await deleteStoredImage(before.artworkUrl);
    await audit(admin, "character.delete", { type: "character", id, label: before.name });
    contentChanged();
    redirect("/admin/characters");
  } catch (error) {
    if (isNavigationError(error)) throw error;
    return actionError(error, "character");
  }
}

/* ---------------- Shows ---------------- */

const seasonRows = z
  .array(
    z.object({
      number: z.union([z.number().int().min(0).max(99), z.literal("")]),
      year: z.union([z.number().int().min(1900).max(2100), z.literal("")]),
      episodeCount: z.union([z.number().int().min(0).max(1000), z.literal("")]),
    }),
  )
  .max(100);

const showSchema = z
  .object({
    title: f.text(160),
    slug: f.slug(),
    aliases: f.list(),
    format: z.enum(["series", "film", "special"]),
    channelId: z.string().min(1, "Choose a channel"),
    genreIds: f.ids(),
    yearStart: f.int(1900, 2100),
    yearEnd: f.optInt(1900, 2100),
    description: f.optText(2000),
    status: z.enum(["draft", "published", "unpublished"]),
    seasons: f.json(seasonRows).default([]),
  })
  .refine((d) => d.yearEnd === undefined || d.yearEnd >= d.yearStart, { message: "Must be after the start year", path: ["yearEnd"] });

export async function saveShow(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("catalog.write");
    const parsed = parseForm(showSchema, formData);
    if (!parsed.ok) return parsed.state;
    const d = parsed.data;
    const seasons = d.seasons.filter((s) => s.number !== "");
    const numbers = seasons.map((s) => s.number);
    if (new Set(numbers).size !== numbers.length) return { message: "Each season number can only appear once.", errors: { seasons: "Duplicate season numbers" } };

    const db = getDb();
    const data = {
      title: d.title,
      slug: d.slug ?? slugify(d.title),
      aliases: d.aliases,
      format: d.format,
      channelId: d.channelId,
      yearStart: d.yearStart,
      yearEnd: d.yearEnd ?? null,
      description: d.description ?? "",
      status: d.status,
    };
    const seasonData = seasons.map((s) => ({
      number: s.number as number,
      year: s.year === "" ? null : s.year,
      episodeCount: s.episodeCount === "" ? null : s.episodeCount,
    }));

    let showId = id;
    if (id) {
      const before = await db.show.findUnique({ where: { id }, include: { genres: true } });
      if (!before) return { message: "This show no longer exists." };
      const [posterUrl, bannerUrl] = await Promise.all([
        resolveImageField(formData, "poster", "shows", before.posterUrl),
        resolveImageField(formData, "banner", "shows", before.bannerUrl),
      ]);
      const update = { ...data, ...(posterUrl !== undefined && { posterUrl }), ...(bannerUrl !== undefined && { bannerUrl }) };
      await db.$transaction([
        db.show.update({ where: { id }, data: update }),
        db.showGenre.deleteMany({ where: { showId: id } }),
        db.showGenre.createMany({ data: d.genreIds.map((genreId) => ({ showId: id, genreId })) }),
        // Seasons are replaced as a set; episodes cascade.
        db.season.deleteMany({ where: { showId: id, number: { notIn: seasonData.map((s) => s.number) } } }),
        ...seasonData.map((s) =>
          db.season.upsert({
            where: { showId_number: { showId: id, number: s.number } },
            update: { year: s.year, episodeCount: s.episodeCount },
            create: { showId: id, ...s },
          }),
        ),
      ]);
      await audit(admin, "show.update", { type: "show", id, label: d.title }, {
        ...diff(before, update),
        ...(before.genres.map((g) => g.genreId).sort().join() !== [...d.genreIds].sort().join() && { genres: { from: "…", to: "…" } }),
      });
    } else {
      const [posterUrl, bannerUrl] = await Promise.all([
        resolveImageField(formData, "poster", "shows", null),
        resolveImageField(formData, "banner", "shows", null),
      ]);
      const created = await db.show.create({
        data: {
          ...data,
          posterUrl: posterUrl ?? null,
          bannerUrl: bannerUrl ?? null,
          genres: { create: d.genreIds.map((genreId) => ({ genreId })) },
          seasons: { create: seasonData },
        },
      });
      showId = created.id;
      await audit(admin, "show.create", { type: "show", id: created.id, label: d.title });
    }

    contentChanged();
    if (!id) redirect(`/admin/shows/${showId}?created=1`);
    return { ok: true, message: "Saved." };
  } catch (error) {
    if (isNavigationError(error)) throw error;
    return actionError(error, "show");
  }
}

export async function deleteShow(_: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("catalog.delete");
    const id = String(formData.get("id"));
    const db = getDb();
    const packs = await db.scenePack.count({ where: { showId: id } });
    const characters = await db.character.count({ where: { showId: id } });
    if (packs || characters) {
      return { message: `Delete or move this show's ${packs} ScenePacks and ${characters} characters first.` };
    }
    const [, before] = await db.$transaction([
      db.collectionItem.deleteMany({ where: { type: "show", targetId: id } }),
      db.show.delete({ where: { id } }),
    ]);
    await Promise.all([deleteStoredImage(before.posterUrl), deleteStoredImage(before.bannerUrl)]);
    await audit(admin, "show.delete", { type: "show", id, label: before.title });
    contentChanged();
    redirect("/admin/shows");
  } catch (error) {
    if (isNavigationError(error)) throw error;
    return actionError(error, "show");
  }
}
