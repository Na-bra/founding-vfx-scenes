import Link from "next/link";
import type { ReactNode } from "react";
import {
  AudioLines,
  CalendarDays,
  CalendarSync,
  Clapperboard,
  Film,
  Frame,
  Gauge,
  HardDrive,
  MonitorPlay,
  Ratio,
  Tv,
} from "lucide-react";
import type { EditingInfo, ScenePackView } from "@/types/content";
import { Artwork } from "@/components/ui/Artwork";
import { Badge, Breadcrumbs, MetaGrid, SectionHeader } from "@/components/ui/Primitives";
import { DownloadButton } from "./DownloadButton";
import { ScenePackActions } from "./ScenePackActions";
import { ScenePackCard } from "./ScenePackCard";
import { formatDate, formatFileSize } from "@/lib/format";
import styles from "./ScenePackDetail.module.css";

const EDITING_LABELS: Record<keyof EditingInfo, [yes: string, no: string]> = {
  raw: ["Raw footage", "Not raw"],
  clean: ["Clean footage", "Not clean"],
  colorGraded: ["Color graded", "Not color graded"],
  upscaled: ["Upscaled", "Native resolution"],
  watermark: ["Watermarked", "No watermark"],
};

function editingFacts(editing: EditingInfo) {
  return (Object.keys(EDITING_LABELS) as (keyof EditingInfo)[])
    .filter((k) => editing[k] !== undefined)
    .map((k) => ({ key: k, label: EDITING_LABELS[k][editing[k] ? 0 : 1], positive: k === "watermark" ? !editing[k] : editing[k] }));
}

function technicalItems(pack: ScenePackView) {
  const t = pack.technical;
  const items = [
    { label: "Resolution", value: t.resolution, icon: <MonitorPlay aria-hidden /> },
    { label: "Frame rate", value: `${t.fps} FPS`, icon: <Gauge aria-hidden /> },
    { label: "Format", value: t.format, icon: <Film aria-hidden /> },
    { label: "Clips", value: t.clipCount.toLocaleString("en-US"), icon: <Clapperboard aria-hidden /> },
    { label: "File size", value: formatFileSize(t.fileSizeBytes), icon: <HardDrive aria-hidden /> },
  ];
  if (t.aspectRatio) items.push({ label: "Aspect ratio", value: t.aspectRatio, icon: <Ratio aria-hidden /> });
  if (t.hasAudio !== undefined) items.push({ label: "Audio", value: t.hasAudio ? "Included" : "No audio", icon: <AudioLines aria-hidden /> });
  return items;
}

/** Full ScenePack page body. Used by the public page and the admin draft preview. */
export function ScenePackDetail({
  pack,
  similar,
  preview,
}: {
  pack: ScenePackView;
  similar: ScenePackView[];
  /** Admin preview: replaces the download/actions with a notice. */
  preview?: ReactNode;
}) {
  const facts = editingFacts(pack.editing);
  const artLabel = pack.characters.length === 1 ? pack.characters[0].name : pack.title.split(" — ")[0];

  const episodeItems = [
    pack.season !== undefined && { label: "Season", value: pack.season },
    pack.episode !== undefined && { label: "Episode", value: pack.episode },
    pack.episodeTitle && { label: "Episode title", value: pack.episodeTitle },
    pack.releaseYear !== undefined && { label: "Release year", value: pack.releaseYear },
  ].filter(Boolean) as { label: string; value: string | number }[];

  return (
    <article>
      <header className={styles.hero}>
        <div className={styles.backdrop} aria-hidden>
          <Artwork seed={pack.slug} image={pack.thumbnail} variant="banner" showLabel={false} sizes="100vw" />
        </div>

        <div className={`container ${styles.heroInner}`}>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "ScenePacks", href: "/scenepacks" },
              { label: pack.show.title, href: `/shows/${pack.show.slug}` },
              { label: pack.title },
            ]}
          />

          <div className={styles.heroGrid}>
            <div className={styles.media}>
              <Artwork
                seed={pack.slug}
                image={pack.thumbnail}
                label={artLabel}
                sublabel={pack.show.title}
                priority
                sizes="(max-width: 1000px) 100vw, 60vw"
              />
              <div className={styles.mediaBadges}>
                <Badge tone="media" mono>
                  {pack.technical.resolution}
                </Badge>
                <Badge tone="media" mono>
                  {pack.technical.fps} FPS
                </Badge>
              </div>
            </div>

            <div className={styles.summary}>
              <p className={styles.kicker}>
                <Tv size={15} aria-hidden />
                <Link href={`/shows/${pack.show.slug}`}>{pack.show.title}</Link>
                <span aria-hidden>·</span>
                <Link href={`/channels/${pack.channel.slug}`}>{pack.channel.name}</Link>
              </p>
              <h1 className={styles.title}>{pack.title}</h1>

              {pack.characters.length > 0 && (
                <p className={styles.characters}>
                  <span className={styles.charactersLabel}>Featuring</span>
                  {pack.characters.map((c) => (
                    <Link key={c.id} href={`/characters/${c.slug}`} className={styles.characterChip}>
                      {c.name}
                    </Link>
                  ))}
                </p>
              )}

              <div className={styles.quickFacts}>
                <span>
                  <Clapperboard size={15} aria-hidden /> {pack.technical.clipCount} clips
                </span>
                <span>
                  <HardDrive size={15} aria-hidden /> {formatFileSize(pack.technical.fileSizeBytes)}
                </span>
                <span>
                  <Frame size={15} aria-hidden /> {pack.technical.format}
                </span>
              </div>

              {preview ?? (
              <>
              <div className={styles.download}>
                <DownloadButton slug={pack.slug} block />
                <p className={styles.version}>
                  Version {pack.version}
                  {pack.publishedAt && <> · Added {formatDate(pack.publishedAt)}</>}
                </p>
              </div>

              <ScenePackActions id={pack.id} title={pack.title} />
              </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className={`container ${styles.details}`}>
        <div className={styles.main}>
          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className={styles.h2}>
              About this ScenePack
            </h2>
            <p className={styles.description}>{pack.description}</p>
            {(pack.genres.length > 0 || pack.tags.length > 0) && (
              <ul className={styles.tags} aria-label="Genres and tags">
                {pack.genres.map((g) => (
                  <li key={g.id}>
                    <Link href={`/genres/${g.slug}`} className={styles.genre}>
                      {g.name}
                    </Link>
                  </li>
                ))}
                {pack.tags.map((t) => (
                  <li key={t.slug}>
                    <Link href={`/scenepacks?tag=${t.slug}`} className={styles.tag}>
                      #{t.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {pack.previews.length > 0 && (
            <section aria-labelledby="preview-heading">
              <h2 id="preview-heading" className={styles.h2}>
                Previews
              </h2>
              <p className={styles.previewNote}>Previews are for reference only and are not part of the download.</p>
              <div className={styles.previews}>
                {pack.previews.map((p, i) =>
                  p.kind === "image" ? (
                    <Artwork key={i} seed={`${pack.slug}-${i}`} image={p.image} showLabel={false} />
                  ) : (
                    <video key={i} src={p.src} poster={p.poster?.src} controls preload="none" muted playsInline className={styles.video} />
                  ),
                )}
              </div>
            </section>
          )}

          <section aria-labelledby="tech-heading">
            <h2 id="tech-heading" className={styles.h2}>
              Technical details
            </h2>
            <MetaGrid items={technicalItems(pack)} />
            {facts.length > 0 && (
              <ul className={styles.facts} aria-label="Editing information">
                {facts.map((f) => (
                  <li key={f.key}>
                    <Badge tone={f.positive ? "success" : "neutral"}>{f.label}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className={styles.side} aria-label="ScenePack information">
          <div className={styles.sideCard}>
            <h2 className={styles.sideTitle}>Source</h2>
            <MetaGrid
              items={[
                { label: "Show", value: <Link href={`/shows/${pack.show.slug}`}>{pack.show.title}</Link> },
                { label: "Channel", value: <Link href={`/channels/${pack.channel.slug}`}>{pack.channel.name}</Link> },
                ...episodeItems,
              ]}
            />
          </div>
          <div className={styles.sideCard}>
            <h2 className={styles.sideTitle}>History</h2>
            <MetaGrid
              items={[
                ...(pack.publishedAt ? [{ label: "Uploaded", value: formatDate(pack.publishedAt), icon: <CalendarDays aria-hidden /> }] : []),
                { label: "Updated", value: formatDate(pack.updatedAt), icon: <CalendarSync aria-hidden /> },
                { label: "Version", value: pack.version },
              ]}
            />
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className={`container ${styles.similar}`} aria-labelledby="similar-heading">
          <SectionHeader
            id="similar-heading"
            eyebrow="Keep exploring"
            title="You May Also Like"
            href={`/shows/${pack.show.slug}`}
            linkLabel={`More from ${pack.show.title}`}
          />
          <div className="rail">
            {similar.map((p) => (
              <ScenePackCard key={p.id} pack={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
