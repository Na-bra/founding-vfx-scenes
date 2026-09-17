import Link from "next/link";
import { ArrowRight, Dices, Tv } from "lucide-react";
import type { ScenePackView } from "@/types/content";
import type { SiteCounts } from "@/lib/data/repository";
import { Artwork } from "@/components/ui/Artwork";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "@/components/search/SearchBar";
import { siteConfig } from "@/config/site";
import styles from "./Hero.module.css";

type Props = {
  wallPacks: ScenePackView[];
  counts: SiteCounts;
  quickSearches: { label: string; href: string }[];
};

export function Hero({ wallPacks, counts, quickSearches }: Props) {
  // Three rows of drifting artwork; each row is duplicated for a seamless loop.
  const rows = [0, 1, 2].map((r) => wallPacks.filter((_, i) => i % 3 === r));

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.background} aria-hidden>
        {wallPacks.length > 0 && (
          <div className={styles.wall}>
            {rows.map((row, r) => (
              <div key={r} className={styles.row} data-row={r}>
                {[...row, ...row, ...row, ...row].map((p, i) => (
                  <div key={`${p.id}-${i}`} className={styles.tile}>
                    <Artwork
                      seed={p.slug}
                      image={p.thumbnail}
                      label={p.characters[0]?.name ?? p.title}
                      sublabel={p.show.title}
                      sizes="320px"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        <div className={styles.orbA} />
        <div className={styles.orbB} />
        <div className={styles.vignette} />
        <div className={styles.grain} />
      </div>

      <div className={`container ${styles.content}`}>
        <p className={`eyebrow ${styles.eyebrow}`}>
          <span className={styles.liveDot} />
          {counts.scenePacks > 0
            ? `${counts.scenePacks} ScenePacks · ${counts.shows} shows · ${counts.channels} channels`
            : "The ScenePack library"}
        </p>

        <h1 id="hero-title" className={styles.title}>
          <span className={styles.titleFounding}>FOUNDING</span>
          <span className={`${styles.titleVfx} gradient-text`}>VFX</span>
        </h1>

        <p className={styles.tagline}>{siteConfig.tagline}</p>

        <div className={styles.search}>
          <SearchBar variant="hero" />
        </div>

        {quickSearches.length > 0 && (
          <ul className={styles.quick} aria-label="Popular shows">
            {quickSearches.map((q) => (
              <li key={q.href}>
                <Link href={q.href}>{q.label}</Link>
              </li>
            ))}
          </ul>
        )}

        <div className={styles.cta}>
          <Button href="/scenepacks" size="lg" iconRight={<ArrowRight size={18} aria-hidden />}>
            Browse ScenePacks
          </Button>
          <Button href="/shows" size="lg" variant="secondary" icon={<Tv size={18} aria-hidden />}>
            Explore Shows
          </Button>
          <Link href="/surprise" prefetch={false} className={styles.surprise}>
            <Dices size={18} aria-hidden />
            Surprise me
          </Link>
        </div>
      </div>
    </section>
  );
}
