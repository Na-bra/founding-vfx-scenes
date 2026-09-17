import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clapperboard, MessageSquarePlus } from "lucide-react";
import { getRepository } from "@/lib/data";
import { EntityHero } from "@/components/layout/EntityHero";
import { CharacterCard } from "@/components/cards/EntityCards";
import { ScenePackCard } from "@/components/scenepack/ScenePackCard";
import { Badge, EmptyState } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { formatCount } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import styles from "@/components/layout/PageBody.module.css";

export async function generateMetadata({ params }: PageProps<"/characters/[slug]">): Promise<Metadata> {
  const detail = await getRepository().getCharacter((await params).slug);
  if (!detail) return { title: "Character not found" };
  const { character } = detail;
  return pageMetadata({
    title: `${character.name} ScenePacks`,
    description: `${formatCount(character.scenePackCount, "ScenePack")} featuring ${character.name} from ${character.show.title}.`,
    path: `/characters/${character.slug}`,
  });
}

export default async function CharacterPage({ params }: PageProps<"/characters/[slug]">) {
  const detail = await getRepository().getCharacter((await params).slug);
  if (!detail) notFound();
  const { character, scenePacks, related } = detail;

  return (
    <>
      <EntityHero
        seed={character.slug}
        title={character.name}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Characters", href: "/characters" },
          { label: character.name },
        ]}
        media={{ kind: "avatar", image: character.artwork }}
        kicker={
          <>
            Character from <Link href={`/shows/${character.show.slug}`}>{character.show.title}</Link>
          </>
        }
        meta={
          <>
            {character.actor && <Badge>Played by {character.actor}</Badge>}
            {character.aliases
              .filter((a) => a !== character.name && !character.name.startsWith(a))
              .map((a) => (
                <Badge key={a}>aka {a}</Badge>
              ))}
            <Badge tone="accent" icon={<Clapperboard aria-hidden />}>
              {formatCount(character.scenePackCount, "ScenePack")}
            </Badge>
          </>
        }
        description={character.description}
      />

      <div className={`container ${styles.body}`}>
        <section aria-labelledby="packs-heading">
          <h2 id="packs-heading" className={styles.sectionTitle}>
            ScenePacks <span className={styles.sectionCount}>{scenePacks.length}</span>
          </h2>
          {scenePacks.length === 0 ? (
            <EmptyState
              icon={<Clapperboard size={26} aria-hidden />}
              title={`No ${character.name} ScenePacks yet.`}
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

        {related.length > 0 && (
          <section aria-labelledby="related-heading">
            <h2 id="related-heading" className={styles.sectionTitle}>
              Also in {character.show.title}
            </h2>
            <div className={styles.characterGrid}>
              {related.map((c) => (
                <CharacterCard key={c.id} character={c} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
