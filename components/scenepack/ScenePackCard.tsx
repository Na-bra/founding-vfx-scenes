import Link from "next/link";
import { ArrowUpRight, CalendarDays, Film, HardDrive } from "lucide-react";
import type { ScenePackView } from "@/types/content";
import { Artwork } from "@/components/ui/Artwork";
import { Badge } from "@/components/ui/Primitives";
import { formatDate, formatFileSize, formatSeasonEpisode } from "@/lib/format";
import { QuickViewButton } from "./QuickView";
import { toPreview } from "./types";
import styles from "./ScenePackCard.module.css";

type Props = {
  pack: ScenePackView;
  priority?: boolean;
  /** Emphasize the publish date (used by "Just Added"). */
  showDate?: boolean;
};

export function ScenePackCard({ pack, priority, showDate }: Props) {
  const href = `/scenepacks/${pack.slug}`;
  const t = pack.technical;
  const seasonEpisode = formatSeasonEpisode(pack.season, pack.episode);
  const artLabel = pack.characters.length === 1 ? pack.characters[0].name : pack.title.split(" — ")[0];

  return (
    <article className={styles.card}>
      <div className={styles.mediaWrap}>
        <Link href={href} className={styles.media} tabIndex={-1} aria-hidden>
          <Artwork
            seed={pack.slug}
            image={pack.thumbnail}
            label={artLabel}
            sublabel={pack.show.title}
            priority={priority}
            className={styles.art}
          />
          <span className={styles.overlay}>
            <span className={styles.overlayMeta}>
              <span>
                <Film size={14} aria-hidden /> {t.clipCount} clips
              </span>
              <span>
                <HardDrive size={14} aria-hidden /> {formatFileSize(t.fileSizeBytes)}
              </span>
              {pack.publishedAt && (
                <span>
                  <CalendarDays size={14} aria-hidden /> {formatDate(pack.publishedAt)}
                </span>
              )}
            </span>
            <span className={styles.viewPill}>
              View <ArrowUpRight size={15} aria-hidden />
            </span>
          </span>
        </Link>
        <div className={styles.badges}>
          <Badge tone="media" mono>
            {t.resolution}
          </Badge>
          <Badge tone="media" mono>
            {t.fps} FPS
          </Badge>
        </div>
        <QuickViewButton pack={toPreview(pack)} className={styles.quickView} />
      </div>

      <div className={styles.body}>
        <p className={styles.kicker}>
          <Link href={`/shows/${pack.show.slug}`}>{pack.show.title}</Link>
          <span aria-hidden>·</span>
          <Link href={`/channels/${pack.channel.slug}`}>{pack.channel.name}</Link>
        </p>
        <h3 className={styles.title}>
          <Link href={href} className={styles.titleLink}>
            {pack.title}
          </Link>
        </h3>
        <p className={styles.meta}>
          {showDate && pack.publishedAt ? (
            <span className={styles.date}>Added {formatDate(pack.publishedAt)}</span>
          ) : (
            <>
              {pack.genres[0] && <span>{pack.genres[0].name}</span>}
              {seasonEpisode && <span>{seasonEpisode}</span>}
            </>
          )}
          <span className="mono">{t.clipCount} clips</span>
          <span className="mono">{formatFileSize(t.fileSizeBytes)}</span>
        </p>
      </div>
    </article>
  );
}
