import type { ReactNode } from "react";
import type { ImageAsset } from "@/types/content";
import { Artwork } from "@/components/ui/Artwork";
import { Breadcrumbs } from "@/components/ui/Primitives";
import styles from "./EntityHero.module.css";

type Props = {
  seed: string;
  title: string;
  kicker?: ReactNode;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  breadcrumbs: { label: string; href?: string }[];
  banner?: ImageAsset;
  /** "poster" for shows, "avatar" for characters, "none" for typographic heroes. */
  media?: { kind: "poster" | "avatar"; image?: ImageAsset; label?: string; sublabel?: string } | { kind: "none" };
};

export function EntityHero({ seed, title, kicker, description, meta, actions, breadcrumbs, banner, media = { kind: "none" } }: Props) {
  return (
    <header className={styles.hero} data-media={media.kind}>
      <div className={styles.banner} aria-hidden>
        <Artwork seed={seed} image={banner} variant="banner" showLabel={false} sizes="100vw" priority />
        <span className={styles.fade} />
      </div>

      <div className={`container ${styles.inner}`}>
        <Breadcrumbs items={breadcrumbs} />
        <div className={styles.row}>
          {media.kind === "poster" && (
            <div className={styles.poster}>
              <Artwork seed={seed} image={media.image} variant="poster" label={media.label ?? title} sublabel={media.sublabel} sizes="240px" priority />
            </div>
          )}
          {media.kind === "avatar" && (
            <div className={styles.avatar}>
              <Artwork seed={seed} image={media.image} variant="square" showLabel={false} sizes="180px" priority />
              <span className={styles.initials} aria-hidden>
                {title
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")}
              </span>
            </div>
          )}
          <div className={styles.text}>
            {kicker && <div className={`eyebrow ${styles.kicker}`}>{kicker}</div>}
            <h1 className={styles.title}>{title}</h1>
            {meta && <div className={styles.meta}>{meta}</div>}
            {description && <p className={styles.description}>{description}</p>}
            {actions && <div className={styles.actions}>{actions}</div>}
          </div>
        </div>
      </div>
    </header>
  );
}
