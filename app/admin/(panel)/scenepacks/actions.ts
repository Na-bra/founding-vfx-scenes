"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { authorize } from "@/lib/admin/auth";
import { audit, diff } from "@/lib/admin/audit";
import { contentChanged } from "@/lib/admin/content";
import { actionError, f, isNavigationError, parseForm, slugify } from "@/lib/admin/forms";
import type { FormState } from "@/lib/admin/form-state";
import { can } from "@/lib/admin/permissions";
import { deleteStoredImage, resolveImageField } from "@/lib/admin/upload";
import { resolutionToDb } from "@/lib/data/prisma/mappers";
import { normalize } from "@/lib/search/text";
import { getStorageProvider } from "@/services/storage";
import type { StorageProviderId } from "@/types/storage";

const PROVIDERS = ["external_url", "google_drive", "mega", "terabox", "cloudflare_r2", "backblaze_b2"] as const;
const SIZE_UNITS = { MB: 1024 ** 2, GB: 1024 ** 3 } as const;

const schema = z
  .object({
    title: f.text(160),
    slug: f.slug(),
    description: f.optText(4000),
    showId: z.string().min(1, "Choose a show"),
    characterIds: f.ids(),
    genreIds: f.ids(),
    tagSlugs: f.ids(),
    newTags: f.list(),
    season: f.optInt(0, 99),
    episode: f.optInt(0, 999),
    episodeTitle: f.optText(160),
    releaseYear: f.optInt(1900, 2100),
    thumbnailAlt: f.optText(200),
    resolution: z.enum(["720p", "1080p", "1440p", "4K"]),
    fps: f.int(1, 240),
    format: f.text(60),
    fileSize: f.optNumber(0, 10_000_000),
    fileSizeUnit: z.enum(["MB", "GB"]).default("GB"),
    clipCount: f.int(0, 100_000),
    aspectRatio: f.optText(20),
    hasAudio: f.triState(),
    isRaw: f.triState(),
    isClean: f.triState(),
    isColorGraded: f.triState(),
    isUpscaled: f.triState(),
    hasWatermark: f.triState(),
    status: z.enum(["draft", "published", "scheduled", "unpublished"]),
    publishAt: f.isoDate(),
    featured: f.bool(),
    version: z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim() : "1.0"), z.string().max(20)),
    versionNotes: f.optText(500),
    storageProvider: z.preprocess((v) => (v === "" ? undefined : v), z.enum(PROVIDERS).optional()),
    downloadUrl: f.optText(2000),
    objectId: f.optText(500),
    checksum: f.optText(128),
    confirmDuplicate: f.bool(),
  })
  .superRefine((d, ctx) => {
    if (d.status === "scheduled" && (!d.publishAt || d.publishAt.getTime() <= Date.now())) {
      ctx.addIssue({ code: "custom", path: ["publishAt"], message: "Pick a future date and time" });
    }
    if (d.episode !== undefined && d.season === undefined) {
      ctx.addIssue({ code: "custom", path: ["season"], message: "Set the season for this episode" });
    }
    if (d.storageProvider && !d.downloadUrl && !d.objectId) {
      ctx.addIssue({ code: "custom", path: ["downloadUrl"], message: "Add a link or file path for this provider" });
    }
  });

type Parsed = z.infer<typeof schema>;

function publishedAtFor(d: Parsed, existing: Date | null): Date | null {
  if (d.status === "scheduled") return d.publishAt!;
  if (d.status === "published") {
    if (d.publishAt && d.publishAt.getTime() <= Date.now()) return d.publishAt;
    return existing && existing.getTime() <= Date.now() ? existing : new Date();
  }
  return existing; // drafts/unpublished keep their history; visibility comes from status
}

async function findDuplicates(d: Parsed, excludeId: string | null) {
  const db = getDb();
  const candidates = await db.scenePack.findMany({
    where: { showId: d.showId, ...(excludeId && { id: { not: excludeId } }) },
    select: { id: true, title: true, season: true, episode: true, characters: { select: { characterId: true } }, storage: { where: { isCurrent: true }, select: { checksum: true } } },
  });
  const title = normalize(d.title);
  return candidates
    .filter((c) => {
      if (normalize(c.title) === title) return true;
      if (d.checksum && c.storage.some((s) => s.checksum === d.checksum)) return true;
      const sameEpisode = d.season !== undefined && c.season === d.season && (c.episode ?? null) === (d.episode ?? null);
      const sharesCharacter = c.characters.some((x) => d.characterIds.includes(x.characterId));
      return sameEpisode && sharesCharacter && d.characterIds.length > 0;
    })
    .map((c) => ({ id: c.id, title: c.title, href: `/admin/scenepacks/${c.id}` }));
}

export async function saveScenePack(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("scenepacks.write");
    const parsed = parseForm(schema, formData);
    if (!parsed.ok) return parsed.state;
    const d = parsed.data;
    const db = getDb();

    // Validate the download destination against the provider's rules (host, HTTPS).
    if (d.storageProvider) {
      const check = await getStorageProvider(d.storageProvider as StorageProviderId).resolveDownload({
        id: "check",
        scenePackId: id ?? "new",
        provider: d.storageProvider as StorageProviderId,
        downloadUrl: d.downloadUrl,
        objectId: d.objectId,
        health: "unknown",
      });
      if (!check.ok && check.reason === "provider_error") {
        return { message: check.detail ?? "That download link isn't valid for this provider.", errors: { downloadUrl: check.detail ?? "Invalid link" } };
      }
    }

    if (!d.confirmDuplicate) {
      const duplicates = await findDuplicates(d, id);
      if (duplicates.length > 0) return { message: "Possible duplicate — confirm below to save anyway.", duplicates };
    }

    const before = id
      ? await db.scenePack.findUnique({ where: { id }, include: { characters: true, genres: true, tags: true, storage: { where: { isCurrent: true } } } })
      : null;
    if (id && !before) return { message: "This ScenePack no longer exists." };

    const newTagSlugs = d.newTags.map((t) => ({ label: t.replace(/^#/, "").toLowerCase(), slug: slugify(t) })).filter((t) => t.slug);
    const tagSlugs = [...new Set([...d.tagSlugs, ...newTagSlugs.map((t) => t.slug)])];
    const thumbnailUrl = await resolveImageField(formData, "thumbnail", "scenepacks", before?.thumbnailUrl ?? null);

    const data = {
      title: d.title,
      slug: d.slug ?? slugify(d.title),
      description: d.description ?? "",
      showId: d.showId,
      season: d.season ?? null,
      episode: d.episode ?? null,
      episodeTitle: d.episodeTitle ?? null,
      releaseYear: d.releaseYear ?? null,
      thumbnailAlt: d.thumbnailAlt ?? null,
      resolution: resolutionToDb(d.resolution),
      fps: d.fps,
      format: d.format,
      fileSizeBytes: BigInt(Math.round((d.fileSize ?? 0) * SIZE_UNITS[d.fileSizeUnit])),
      clipCount: d.clipCount,
      aspectRatio: d.aspectRatio ?? null,
      hasAudio: d.hasAudio,
      isRaw: d.isRaw,
      isClean: d.isClean,
      isColorGraded: d.isColorGraded,
      isUpscaled: d.isUpscaled,
      hasWatermark: d.hasWatermark,
      status: d.status,
      publishedAt: publishedAtFor(d, before?.publishedAt ?? null),
      // Uploaders can't change featured status.
      featured: can(admin.role, "scenepacks.feature") ? d.featured : (before?.featured ?? false),
      version: d.version,
      ...(thumbnailUrl !== undefined && { thumbnailUrl }),
    };

    const currentStorage = before?.storage[0];
    const storageChanged =
      (currentStorage?.provider ?? undefined) !== d.storageProvider ||
      (currentStorage?.downloadUrl ?? undefined) !== d.downloadUrl ||
      (currentStorage?.objectId ?? undefined) !== d.objectId ||
      (currentStorage?.checksum ?? undefined) !== d.checksum;
    const versionChanged = !before || before.version !== d.version;

    const packId = await db.$transaction(async (tx) => {
      for (const t of newTagSlugs) await tx.tag.upsert({ where: { slug: t.slug }, update: {}, create: t });

      const pack = before ? await tx.scenePack.update({ where: { id: before.id }, data }) : await tx.scenePack.create({ data });

      await tx.scenePackCharacter.deleteMany({ where: { scenePackId: pack.id } });
      await tx.scenePackGenre.deleteMany({ where: { scenePackId: pack.id } });
      await tx.scenePackTag.deleteMany({ where: { scenePackId: pack.id } });
      await tx.scenePackCharacter.createMany({ data: d.characterIds.map((characterId) => ({ scenePackId: pack.id, characterId })) });
      await tx.scenePackGenre.createMany({ data: d.genreIds.map((genreId) => ({ scenePackId: pack.id, genreId })) });
      await tx.scenePackTag.createMany({ data: tagSlugs.map((tagSlug) => ({ scenePackId: pack.id, tagSlug })) });

      let storageId = currentStorage?.id ?? null;
      if (storageChanged) {
        await tx.storageObject.updateMany({ where: { scenePackId: pack.id, isCurrent: true }, data: { isCurrent: false } });
        storageId = null;
        if (d.storageProvider) {
          const created = await tx.storageObject.create({
            data: {
              scenePackId: pack.id,
              provider: d.storageProvider,
              downloadUrl: d.downloadUrl ?? null,
              objectId: d.objectId ?? null,
              checksum: d.checksum ?? null,
              fileSizeBytes: data.fileSizeBytes,
              fileType: d.format,
            },
          });
          storageId = created.id;
        }
      }

      if (versionChanged) {
        await tx.scenePackVersion.upsert({
          where: { scenePackId_version: { scenePackId: pack.id, version: d.version } },
          update: { notes: d.versionNotes ?? null, storageObjectId: storageId },
          create: { scenePackId: pack.id, version: d.version, notes: d.versionNotes ?? (before ? null : "Initial release"), storageObjectId: storageId },
        });
      }
      return pack.id;
    });

    const label = d.title;
    if (before) {
      const changes: Record<string, { from?: unknown; to?: unknown }> = diff(before as unknown as Record<string, unknown>, data as unknown as Record<string, unknown>);
      if (storageChanged) changes.downloadUrl = { from: "…", to: "…" };
      const ids = (xs: { [k: string]: string }[], k: string) => xs.map((x) => x[k]).sort().join();
      if (ids(before.characters, "characterId") !== [...d.characterIds].sort().join()) changes.characters = { from: "…", to: "…" };
      if (ids(before.genres, "genreId") !== [...d.genreIds].sort().join()) changes.genres = { from: "…", to: "…" };
      if (ids(before.tags, "tagSlug") !== [...tagSlugs].sort().join()) changes.tags = { from: "…", to: "…" };
      await audit(admin, "scenepack.update", { type: "scenepack", id: packId, label }, changes);
    } else {
      await audit(admin, "scenepack.create", { type: "scenepack", id: packId, label }, { status: { to: d.status } });
    }

    contentChanged();
    if (!before) redirect(`/admin/scenepacks/${packId}?created=1`);
    return { ok: true, message: d.status === "scheduled" ? `Saved — goes live ${d.publishAt!.toLocaleString("en-GB", { timeZone: "UTC" })} UTC.` : "Saved." };
  } catch (error) {
    if (isNavigationError(error)) throw error;
    return actionError(error, "ScenePack");
  }
}

export async function setScenePackStatus(_: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("scenepacks.write");
    const id = String(formData.get("id"));
    const status = z.enum(["published", "unpublished"]).parse(formData.get("status"));
    const db = getDb();
    const before = await db.scenePack.findUnique({ where: { id }, select: { title: true, status: true, publishedAt: true } });
    if (!before) return { message: "This ScenePack no longer exists." };
    const publishedAt = status === "published" && (!before.publishedAt || before.publishedAt.getTime() > Date.now()) ? new Date() : before.publishedAt;
    await db.scenePack.update({ where: { id }, data: { status, publishedAt } });
    await audit(admin, `scenepack.${status === "published" ? "publish" : "unpublish"}`, { type: "scenepack", id, label: before.title }, { status: { from: before.status, to: status } });
    contentChanged();
    return { ok: true, message: status === "published" ? "Published." : "Unpublished." };
  } catch (error) {
    return actionError(error, "ScenePack");
  }
}

export async function deleteScenePack(_: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("scenepacks.delete");
    const id = String(formData.get("id"));
    const db = getDb();
    const [, before] = await db.$transaction([
      db.collectionItem.deleteMany({ where: { type: "scenepack", targetId: id } }),
      db.scenePack.delete({ where: { id } }),
    ]);
    await deleteStoredImage(before.thumbnailUrl);
    await audit(admin, "scenepack.delete", { type: "scenepack", id, label: before.title });
    contentChanged();
    redirect("/admin/scenepacks");
  } catch (error) {
    if (isNavigationError(error)) throw error;
    return actionError(error, "ScenePack");
  }
}
