import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clapperboard, MessageSquarePlus } from "lucide-react";
import { getRepository } from "@/lib/data";
import { EntityHero } from "@/components/layout/EntityHero";
import { CharacterCard, ShowCard } from "@/components/cards/EntityCards";
import { ScenePackCard } from "@/components/scenepack/ScenePackCard";
import { Badge, ChipLink, EmptyState } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { formatCount, formatYears } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import styles from "@/components/layout/PageBody.module.css";

export async function generateMetadata({ params }: PageProps<"/shows/[slug]">): Promise<Metadata> {
  const detail = await getRepository().getShow((await params).slug);
  if (!detail) return { title: "Show not found" };
  const { show } = detail;
  return pageMetadata({
    title: `${show.title} ScenePacks`,
    description: `${formatCount(show.scenePackCount, "ScenePack")} from ${show.title} (${show.channel.name}, ${formatYears(show.yearStart, show.yearEnd)}). ${show.description}`,
    path: `/shows/${show.slug}`,
  });
}

export default async function ShowPage({ params }: PageProps<"/shows/[slug]">) {
  const detail = await getRepository().getShow((await params).slug);
  if (!detail) notFound();
  const { show, characters, seasons, related } = detail;
  const seasonAnchor = (n: number | null) => (n === null ? "other" : `season-${n}`);
  const hasSeasonNav = seasons.length > 1;

  return (
    <>
      <EntityHero
        seed={show.slug}
        banner={show.banner}
        title={show.title}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Shows", href: "/shows" }, { label: show.title }]}
        media={{ kind: "poster", image: show.poster, sublabel: show.channel.name }}
        kicker={
          <>
            <Link href={`/channels/${show.channel.slug}`}>{show.channel.name}</Link>
            <span aria-hidden>·</span>
            <span>{formatYears(show.yearStart, show.yearEnd)}</span>
            {show.format === "series" && show.seasons.length > 0 && (
              <>
                <span aria-hidden>·</span>
                <span>{formatCount(show.seasons.length, "season")}</span>
              </>
            )}
            {show.format === "film" && (
              <>
                <span aria-hidden>·</span>
                <span>Film</span>
              </>
            )}
          </>
        }
        meta={
          <>
            {show.genres.map((g) => (
              <ChipLink key={g.id} href={`/genres/${g.slug}`}>
                {g.name}
              </ChipLink>
            ))}
            <Badge tone="accent" icon={<Clapperboard aria-hidden />}>
              {formatCount(show.scenePackCount, "ScenePack")}
            </Badge>
          </>
        }
        description={show.description}
      />

      <div className={`container ${styles.body}`}>
        <section aria-labelledby="packs-heading">
          <h2 id="packs-heading" className={styles.sectionTitle}>
            ScenePacks <span className={styles.sectionCount}>{show.scenePackCount}</span>
          </h2>

          {seasons.length === 0 ? (
            <EmptyState
              icon={<Clapperboard size={26} aria-hidden />}
              title={`No ${show.title} ScenePacks yet.`}
              description="Want one? Request it and the community can vote it up."
              action={
                <Button href="/requests/new" icon={<MessageSquarePlus size={18} aria-hidden />}>
                  Request a ScenePack
                </Button>
              }
            />
          ) : (
            <>
              {hasSeasonNav && (
                <nav className={styles.seasonNav} aria-label="Seasons">
                  {seasons.map((s) => (
                    <ChipLink key={seasonAnchor(s.season)} href={`#${seasonAnchor(s.season)}`}>
                      {s.season === null ? "Other" : `Season ${s.season}`}
                    </ChipLink>
                  ))}
                </nav>
              )}
              <div className={styles.body}>
                {seasons.map((s) => (
                  <section key={seasonAnchor(s.season)} id={seasonAnchor(s.season)} className={styles.season} aria-label={s.season === null ? "Other ScenePacks" : `Season ${s.season}`}>
                    {(hasSeasonNav || s.season !== null) && (
                      <div className={styles.seasonHeader}>
                        <h3 className={styles.seasonNumber}>{s.season === null ? (show.format === "film" ? "Film" : "Across seasons") : `Season ${s.season}`}</h3>
                        {s.year && <span className={styles.seasonYear}>{s.year}</span>}
                      </div>
                    )}
                    <div className="grid-cards">
                      {s.scenePacks.map((p) => (
                        <ScenePackCard key={p.id} pack={p} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}
        </section>

        {characters.length > 0 && (
          <section aria-labelledby="characters-heading">
            <h2 id="characters-heading" className={styles.sectionTitle}>
              Characters <span className={styles.sectionCount}>{characters.length}</span>
            </h2>
            <div className={styles.characterGrid}>
              {characters.map((c) => (
                <CharacterCard key={c.id} character={c} />
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section aria-labelledby="related-heading">
            <h2 id="related-heading" className={styles.sectionTitle}>
              Related shows
            </h2>
            <div className="grid-posters">
              {related.map((s) => (
                <ShowCard key={s.id} show={s} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
