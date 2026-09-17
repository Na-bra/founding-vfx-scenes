import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarSync, ListVideo } from "lucide-react";
import { getRepository } from "@/lib/data";
import { EntityHero } from "@/components/layout/EntityHero";
import { ScenePackCard } from "@/components/scenepack/ScenePackCard";
import { Badge, EmptyState } from "@/components/ui/Primitives";
import { formatCount, formatDate } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import styles from "@/components/layout/PageBody.module.css";

export async function generateMetadata({ params }: PageProps<"/playlists/[slug]">): Promise<Metadata> {
  const detail = await getRepository().getPlaylist((await params).slug);
  if (!detail) return { title: "Playlist not found" };
  const { playlist } = detail;
  return pageMetadata({
    title: playlist.title,
    description: `${formatCount(playlist.scenePackCount, "ScenePack")} · ${playlist.description}`,
    path: `/playlists/${playlist.slug}`,
    noIndex: playlist.visibility !== "public",
  });
}

export default async function PlaylistPage({ params }: PageProps<"/playlists/[slug]">) {
  const detail = await getRepository().getPlaylist((await params).slug);
  if (!detail) notFound();
  const { playlist, scenePacks } = detail;
  const cover = scenePacks[0];

  return (
    <>
      <EntityHero
        seed={cover?.slug ?? playlist.slug}
        banner={playlist.thumbnail ?? cover?.thumbnail}
        title={playlist.title}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Playlists", href: "/playlists" }, { label: playlist.title }]}
        kicker={
          <>
            <ListVideo size={14} aria-hidden /> Playlist
          </>
        }
        meta={
          <>
            <Badge tone="accent">{formatCount(playlist.scenePackCount, "ScenePack")}</Badge>
            <Badge icon={<CalendarSync aria-hidden />}>Updated {formatDate(playlist.updatedAt)}</Badge>
          </>
        }
        description={playlist.description}
      />
      <div className="container">
        {scenePacks.length === 0 ? (
          <EmptyState icon={<ListVideo size={26} aria-hidden />} title="This playlist is empty." />
        ) : (
          <ol className="grid-cards" style={{ listStyle: "none", padding: 0 }}>
            {scenePacks.map((p, i) => (
              <li key={p.id} aria-label={`${i + 1}. ${p.title}`}>
                <p className={styles.letter} style={{ margin: "0 0 8px" }} aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </p>
                <ScenePackCard pack={p} priority={i < 3} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
