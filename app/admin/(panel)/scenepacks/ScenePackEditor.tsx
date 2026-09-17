import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, EyeOff, Rocket, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { can } from "@/lib/admin/permissions";
import { getDb } from "@/lib/db";
import { resolutionFromDb } from "@/lib/data/prisma/mappers";
import { ActionButton } from "@/components/admin/FormKit";
import { AdminPageHead, LinkButton, Pill, dateTime, adminStyles as styles } from "@/components/admin/ui";
import { deleteScenePack, saveScenePack, setScenePackStatus } from "./actions";
import { ScenePackForm, type ScenePackFormValues } from "./ScenePackForm";

const GB = 1024 ** 3;
const MB = 1024 ** 2;

export async function ScenePackEditor({ id, showId }: { id: string | null; showId?: string }) {
  const admin = await requireAdmin("scenepacks.write");
  const db = getDb();
  const [record, shows, characters, genres, tags] = await Promise.all([
    id
      ? db.scenePack.findUnique({
          where: { id },
          include: {
            characters: true,
            genres: true,
            tags: true,
            storage: { where: { isCurrent: true }, take: 1 },
            versions: { orderBy: { createdAt: "desc" } },
            show: { select: { title: true, status: true } },
          },
        })
      : null,
    db.show.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    db.character.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, showId: true } }),
    db.genre.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.tag.findMany({ orderBy: { label: "asc" } }),
  ]);
  if (id && !record) notFound();

  const bytes = record ? Number(record.fileSizeBytes) : 0;
  const unit: "GB" | "MB" = bytes >= GB ? "GB" : "MB";
  const storage = record?.storage[0];
  const values: ScenePackFormValues = {
    title: record?.title ?? "",
    slug: record?.slug ?? "",
    description: record?.description ?? "",
    showId: record?.showId ?? showId ?? "",
    characterIds: record?.characters.map((c) => c.characterId) ?? [],
    genreIds: record?.genres.map((g) => g.genreId) ?? [],
    tagSlugs: record?.tags.map((t) => t.tagSlug) ?? [],
    season: record?.season ?? null,
    episode: record?.episode ?? null,
    episodeTitle: record?.episodeTitle ?? null,
    releaseYear: record?.releaseYear ?? null,
    thumbnailUrl: record?.thumbnailUrl ?? null,
    thumbnailAlt: record?.thumbnailAlt ?? null,
    resolution: record ? resolutionFromDb(record.resolution) : "1080p",
    fps: record?.fps ?? 30,
    format: record?.format ?? "MP4 (H.264)",
    fileSize: record ? Math.round((bytes / (unit === "GB" ? GB : MB)) * 100) / 100 : null,
    fileSizeUnit: unit,
    clipCount: record?.clipCount ?? 0,
    aspectRatio: record?.aspectRatio ?? "16:9",
    hasAudio: record?.hasAudio ?? null,
    isRaw: record?.isRaw ?? null,
    isClean: record?.isClean ?? null,
    isColorGraded: record?.isColorGraded ?? null,
    isUpscaled: record?.isUpscaled ?? null,
    hasWatermark: record?.hasWatermark ?? null,
    status: record?.status ?? "draft",
    publishedAt: record?.publishedAt?.toISOString() ?? null,
    featured: record?.featured ?? false,
    version: record?.version ?? "1.0",
    storageProvider: storage?.provider ?? "",
    downloadUrl: storage?.downloadUrl ?? "",
    objectId: storage?.objectId ?? "",
    checksum: storage?.checksum ?? "",
  };

  const live = record && (record.status === "published" || record.status === "scheduled") && record.publishedAt && record.publishedAt <= new Date() && record.show.status === "published";

  return (
    <>
      <AdminPageHead
        title={record ? record.title : "New ScenePack"}
        description={
          record
            ? `${record.show.title} · updated ${dateTime(record.updatedAt)}${record.status === "scheduled" && record.publishedAt ? ` · goes live ${dateTime(record.publishedAt)}` : ""}`
            : "Fill in the details, then save as a draft or publish."
        }
        crumbs={[{ label: "ScenePacks", href: "/admin/scenepacks" }]}
        actions={
          record && (
            <>
              <Pill value={live ? "published" : record.status} label={live ? "Live" : record.status} />
              <LinkButton href={`/admin/scenepacks/${record.id}/preview`} tone="secondary">
                <Eye size={15} aria-hidden /> Preview
              </LinkButton>
              {live ? (
                <>
                  <Link href={`/scenepacks/${record.slug}`} target="_blank" className={styles.secondaryButton}>
                    View live
                  </Link>
                  <ActionButton action={setScenePackStatus} fields={{ id: record.id, status: "unpublished" }} label="Unpublish" icon={<EyeOff size={15} aria-hidden />} confirm="Hide this ScenePack from the site?" />
                </>
              ) : (
                record.status !== "scheduled" && (
                  <ActionButton action={setScenePackStatus} fields={{ id: record.id, status: "published" }} label="Publish now" tone="primary" icon={<Rocket size={15} aria-hidden />} />
                )
              )}
              {can(admin.role, "scenepacks.delete") && (
                <ActionButton action={deleteScenePack} fields={{ id: record.id }} label="Delete" tone="danger" icon={<Trash2 size={15} aria-hidden />} confirm={`Delete "${record.title}"? This can't be undone.`} />
              )}
            </>
          )
        }
      />
      {record && record.show.status !== "published" && (
        <p className={styles.notice}>The show &ldquo;{record.show.title}&rdquo; is hidden, so this ScenePack won&rsquo;t appear on the site until the show is published.</p>
      )}

      <ScenePackForm
        action={saveScenePack.bind(null, id)}
        values={values}
        shows={shows.map((s) => ({ value: s.id, label: s.title }))}
        characters={characters.map((c) => ({ value: c.id, label: c.name, group: c.showId }))}
        genres={genres.map((g) => ({ value: g.id, label: g.name }))}
        tags={tags.map((t) => ({ value: t.slug, label: `#${t.label}` }))}
        canFeature={can(admin.role, "scenepacks.feature")}
        isNew={!record}
      />

      {record && record.versions.length > 0 && (
        <section className={styles.panel} style={{ marginTop: 16 }}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Version history</h2>
          </div>
          <ul className={styles.history} style={{ padding: "0 16px" }}>
            {record.versions.map((v) => (
              <li key={v.id}>
                <strong>v{v.version}</strong>
                <span className={styles.muted}>{dateTime(v.createdAt)}</span>
                {v.notes && <span>{v.notes}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
