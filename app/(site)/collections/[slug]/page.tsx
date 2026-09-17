import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LibraryBig } from "lucide-react";
import { getRepository } from "@/lib/data";
import { EntityHero } from "@/components/layout/EntityHero";
import { PlaylistCard, ShowCard } from "@/components/cards/EntityCards";
import { ScenePackCard } from "@/components/scenepack/ScenePackCard";
import { Badge, EmptyState } from "@/components/ui/Primitives";
import { formatCount } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import styles from "@/components/layout/PageBody.module.css";

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const detail = await getRepository().getCollection((await params).slug);
  if (!detail) return { title: "Collection not found" };
  const { collection } = detail;
  return pageMetadata({ title: collection.title, description: collection.description, path: `/collections/${collection.slug}` });
}

export default async function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  const detail = await getRepository().getCollection((await params).slug);
  if (!detail) notFound();
  const { collection, shows, playlists, scenePacks } = detail;
  const empty = shows.length + playlists.length + scenePacks.length === 0;

  return (
    <>
      <EntityHero
        seed={collection.slug}
        banner={collection.artwork}
        title={collection.title}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Collections", href: "/collections" }, { label: collection.title }]}
        kicker={
          <>
            <LibraryBig size={14} aria-hidden /> Collection
          </>
        }
        meta={
          <>
            {shows.length > 0 && <Badge>{formatCount(shows.length, "show")}</Badge>}
            {playlists.length > 0 && <Badge>{formatCount(playlists.length, "playlist")}</Badge>}
            {scenePacks.length > 0 && <Badge tone="accent">{formatCount(scenePacks.length, "ScenePack")}</Badge>}
          </>
        }
        description={collection.description}
      />
      <div className={`container ${styles.body}`}>
        {empty && <EmptyState icon={<LibraryBig size={26} aria-hidden />} title="This collection is empty." />}
        {shows.length > 0 && (
          <section aria-labelledby="shows-heading">
            <h2 id="shows-heading" className={styles.sectionTitle}>
              Shows
            </h2>
            <div className="grid-posters">
              {shows.map((s) => (
                <ShowCard key={s.id} show={s} />
              ))}
            </div>
          </section>
        )}
        {playlists.length > 0 && (
          <section aria-labelledby="playlists-heading">
            <h2 id="playlists-heading" className={styles.sectionTitle}>
              Playlists
            </h2>
            <div className={styles.twoCol}>
              {playlists.map((p) => (
                <PlaylistCard key={p.id} playlist={p} />
              ))}
            </div>
          </section>
        )}
        {scenePacks.length > 0 && (
          <section aria-labelledby="packs-heading">
            <h2 id="packs-heading" className={styles.sectionTitle}>
              ScenePacks
            </h2>
            <div className="grid-cards">
              {scenePacks.map((p) => (
                <ScenePackCard key={p.id} pack={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
