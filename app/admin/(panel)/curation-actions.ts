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

/* ---------------- Playlists ---------------- */

const playlistSchema = z.object({
  title: f.text(160),
  slug: f.slug(),
  description: f.optText(1000),
  visibility: z.enum(["public", "unlisted", "private"]),
  featured: f.bool(),
  scenePackIds: f.ids(),
});

export async function savePlaylist(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("curation.write");
    const parsed = parseForm(playlistSchema, formData);
    if (!parsed.ok) return parsed.state;
    const d = parsed.data;
    const db = getDb();
    const data = { title: d.title, slug: d.slug ?? slugify(d.title), description: d.description ?? "", visibility: d.visibility, featured: d.featured };
    const items = [...new Set(d.scenePackIds)].map((scenePackId, position) => ({ scenePackId, position }));

    if (id) {
      const before = await db.playlist.findUnique({ where: { id }, include: { items: { orderBy: { position: "asc" } } } });
      if (!before || before.ownerId) return { message: "This playlist no longer exists." };
      const thumbnailUrl = await resolveImageField(formData, "thumbnail", "playlists", before.thumbnailUrl);
      const update = { ...data, ...(thumbnailUrl !== undefined && { thumbnailUrl }) };
      await db.$transaction([
        db.playlist.update({ where: { id }, data: update }),
        db.playlistItem.deleteMany({ where: { playlistId: id } }),
        db.playlistItem.createMany({ data: items.map((i) => ({ ...i, playlistId: id })) }),
      ]);
      const orderChanged = before.items.map((i) => i.scenePackId).join() !== items.map((i) => i.scenePackId).join();
      await audit(admin, "playlist.update", { type: "playlist", id, label: d.title }, { ...diff(before, update), ...(orderChanged && { scenePacks: { from: before.items.length, to: items.length } }) });
      contentChanged();
      return { ok: true, message: "Saved." };
    }

    const thumbnailUrl = (await resolveImageField(formData, "thumbnail", "playlists", null)) ?? null;
    const created = await db.playlist.create({ data: { ...data, thumbnailUrl, items: { create: items } } });
    await audit(admin, "playlist.create", { type: "playlist", id: created.id, label: d.title });
    contentChanged();
    redirect(`/admin/playlists/${created.id}?created=1`);
  } catch (error) {
    if (isNavigationError(error)) throw error;
    return actionError(error, "playlist");
  }
}

export async function deletePlaylist(_: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("curation.write");
    const id = String(formData.get("id"));
    const db = getDb();
    await db.collectionItem.deleteMany({ where: { type: "playlist", targetId: id } });
    const before = await db.playlist.delete({ where: { id } });
    await deleteStoredImage(before.thumbnailUrl);
    await audit(admin, "playlist.delete", { type: "playlist", id, label: before.title });
    contentChanged();
    redirect("/admin/playlists");
  } catch (error) {
    if (isNavigationError(error)) throw error;
    return actionError(error, "playlist");
  }
}

/* ---------------- Collections ---------------- */

const collectionSchema = z.object({
  title: f.text(160),
  slug: f.slug(),
  description: f.optText(1000),
  featured: f.bool(),
  items: z.preprocess(
    (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]),
    z.array(z.string().regex(/^(show|scenepack|playlist):[A-Za-z0-9_-]+$/)).max(500),
  ),
});

export async function saveCollection(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("curation.write");
    const parsed = parseForm(collectionSchema, formData);
    if (!parsed.ok) return parsed.state;
    const d = parsed.data;
    const db = getDb();
    const data = { title: d.title, slug: d.slug ?? slugify(d.title), description: d.description ?? "", featured: d.featured };
    const items = [...new Set(d.items)].map((key, position) => {
      const [type, targetId] = key.split(":") as ["show" | "scenepack" | "playlist", string];
      return { type, targetId, position };
    });

    if (id) {
      const before = await db.collection.findUnique({ where: { id } });
      if (!before) return { message: "This collection no longer exists." };
      const artworkUrl = await resolveImageField(formData, "artwork", "collections", before.artworkUrl);
      const update = { ...data, ...(artworkUrl !== undefined && { artworkUrl }) };
      await db.$transaction([
        db.collection.update({ where: { id }, data: update }),
        db.collectionItem.deleteMany({ where: { collectionId: id } }),
        db.collectionItem.createMany({ data: items.map((i) => ({ ...i, collectionId: id })) }),
      ]);
      await audit(admin, "collection.update", { type: "collection", id, label: d.title }, diff(before, update));
      contentChanged();
      return { ok: true, message: "Saved." };
    }

    const artworkUrl = (await resolveImageField(formData, "artwork", "collections", null)) ?? null;
    const created = await db.collection.create({ data: { ...data, artworkUrl, items: { create: items } } });
    await audit(admin, "collection.create", { type: "collection", id: created.id, label: d.title });
    contentChanged();
    redirect(`/admin/collections/${created.id}?created=1`);
  } catch (error) {
    if (isNavigationError(error)) throw error;
    return actionError(error, "collection");
  }
}

export async function deleteCollection(_: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("curation.write");
    const id = String(formData.get("id"));
    const before = await getDb().collection.delete({ where: { id } });
    await deleteStoredImage(before.artworkUrl);
    await audit(admin, "collection.delete", { type: "collection", id, label: before.title });
    contentChanged();
    redirect("/admin/collections");
  } catch (error) {
    if (isNavigationError(error)) throw error;
    return actionError(error, "collection");
  }
}
