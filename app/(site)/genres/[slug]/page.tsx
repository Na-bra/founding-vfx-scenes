import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clapperboard, MessageSquarePlus } from "lucide-react";
import { getRepository } from "@/lib/data";
import { EntityHero } from "@/components/layout/EntityHero";
import { ShowCard } from "@/components/cards/EntityCards";
import { ScenePackCard } from "@/components/scenepack/ScenePackCard";
import { Badge, EmptyState } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { formatCount } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import styles from "@/components/layout/PageBody.module.css";

export async function generateMetadata({ params }: PageProps<"/genres/[slug]">): Promise<Metadata> {
  const detail = await getRepository().getGenre((await params).slug);
  if (!detail) return { title: "Genre not found" };
  const { genre } = detail;
  return pageMetadata({
    title: `${genre.name} ScenePacks`,
    description: `${formatCount(genre.scenePackCount, "ScenePack")} in ${genre.name}. ${genre.description}`,
    path: `/genres/${genre.slug}`,
  });
}

export default async function GenrePage({ params }: PageProps<"/genres/[slug]">) {
  const detail = await getRepository().getGenre((await params).slug);
  if (!detail) notFound();
  const { genre, shows, scenePacks } = detail;

  return (
    <>
      <EntityHero
        seed={`genre-${genre.slug}`}
        banner={genre.artwork}
        title={genre.name}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Genres", href: "/genres" }, { label: genre.name }]}
        kicker="Genre"
        meta={
          <Badge tone="accent" icon={<Clapperboard aria-hidden />}>
            {formatCount(genre.scenePackCount, "ScenePack")}
          </Badge>
        }
        description={genre.description}
      />
      <div className={`container ${styles.body}`}>
        <section aria-labelledby="packs-heading">
          <h2 id="packs-heading" className={styles.sectionTitle}>
            ScenePacks <span className={styles.sectionCount}>{scenePacks.length}</span>
          </h2>
          {scenePacks.length === 0 ? (
            <EmptyState
              icon={<Clapperboard size={26} aria-hidden />}
              title={`No ${genre.name} ScenePacks yet.`}
              action={
                <Button href="/requests/new" icon={<MessageSquarePlus size={18} aria-hidden />}>
                  Request a ScenePack
                </Button>
              }
            />
          ) : (
            <div className="grid-cards">
              {scenePacks.map((p) => (
                <ScenePackCard key={p.id} pack={p} />
              ))}
            </div>
          )}
        </section>
        {shows.length > 0 && (
          <section aria-labelledby="shows-heading">
            <h2 id="shows-heading" className={styles.sectionTitle}>
              {genre.name} shows <span className={styles.sectionCount}>{shows.length}</span>
            </h2>
            <div className="grid-posters">
              {shows.map((s) => (
                <ShowCard key={s.id} show={s} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
