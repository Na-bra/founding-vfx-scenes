import { Users } from "lucide-react";
import { getRepository } from "@/lib/data";
import { CharacterCard } from "@/components/cards/EntityCards";
import { EmptyState, PageHeader } from "@/components/ui/Primitives";
import { pageMetadata } from "@/lib/seo";
import styles from "@/components/layout/PageBody.module.css";

export const metadata = pageMetadata({
  title: "Characters",
  description: "Find ScenePacks by character on FoundingVFX.",
  path: "/characters",
});

export default async function CharactersPage() {
  const characters = await getRepository().listCharacters();
  const byLetter = new Map<string, typeof characters>();
  for (const c of characters) {
    const letter = /[a-z]/i.test(c.name[0]) ? c.name[0].toUpperCase() : "#";
    byLetter.set(letter, [...(byLetter.get(letter) ?? []), c]);
  }

  return (
    <>
      <PageHeader
        eyebrow="Browse"
        title="Characters"
        description="Jump straight to the characters you edit most."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Characters" }]}
      />
      <div className="container">
        {characters.length === 0 ? (
          <EmptyState icon={<Users size={26} aria-hidden />} title="Characters are coming soon." />
        ) : (
          [...byLetter].map(([letter, list]) => (
            <section key={letter} aria-label={letter}>
              <h2 className={styles.letter}>{letter}</h2>
              <div className={styles.characterGrid}>
                {list.map((c) => (
                  <CharacterCard key={c.id} character={c} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </>
  );
}
