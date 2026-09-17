import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clapperboard, Tv } from "lucide-react";
import { getRepository } from "@/lib/data";
import { EntityHero } from "@/components/layout/EntityHero";
import { ShowCard } from "@/components/cards/EntityCards";
import { ScenePackCard } from "@/components/scenepack/ScenePackCard";
import { Badge, EmptyState } from "@/components/ui/Primitives";
import { formatCount } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import styles from "@/components/layout/PageBody.module.css";

export async function generateMetadata({ params }: PageProps<"/channels/[slug]">): Promise<Metadata> {
  const detail = await getRepository().getChannel((await params).slug);
  if (!detail) return { title: "Channel not found" };
  const { channel } = detail;
  return pageMetadata({
    title: `${channel.name} ScenePacks`,
    description: `${formatCount(channel.scenePackCount, "ScenePack")} from ${formatCount(channel.showCount, "show")} on ${channel.name}. ${channel.description}`,
    path: `/channels/${channel.slug}`,
  });
}

export default async function ChannelPage({ params }: PageProps<"/channels/[slug]">) {
  const detail = await getRepository().getChannel((await params).slug);
  if (!detail) notFound();
  const { channel, shows, scenePacks } = detail;

  return (
    <>
      <EntityHero
        seed={`channel-${channel.slug}`}
        banner={channel.artwork}
        title={channel.name}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Channels", href: "/channels" }, { label: channel.name }]}
        kicker="Channel"
        meta={
          <>
            <Badge icon={<Tv aria-hidden />}>{formatCount(channel.showCount, "show")}</Badge>
            <Badge tone="accent" icon={<Clapperboard aria-hidden />}>
              {formatCount(channel.scenePackCount, "ScenePack")}
            </Badge>
          </>
        }
        description={channel.description}
      />
      <div className={`container ${styles.body}`}>
        {shows.length > 0 && (
          <section aria-labelledby="shows-heading">
            <h2 id="shows-heading" className={styles.sectionTitle}>
              Shows <span className={styles.sectionCount}>{shows.length}</span>
            </h2>
            <div className="grid-posters">
              {[...shows]
                .sort((a, b) => b.scenePackCount - a.scenePackCount)
                .map((s) => (
                  <ShowCard key={s.id} show={s} />
                ))}
            </div>
          </section>
        )}
        <section aria-labelledby="packs-heading">
          <h2 id="packs-heading" className={styles.sectionTitle}>
            Latest ScenePacks <span className={styles.sectionCount}>{scenePacks.length}</span>
          </h2>
          {scenePacks.length === 0 ? (
            <EmptyState icon={<Clapperboard size={26} aria-hidden />} title={`No ${channel.name} ScenePacks yet.`} />
          ) : (
            <div className="grid-cards">
              {scenePacks.map((p) => (
                <ScenePackCard key={p.id} pack={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
