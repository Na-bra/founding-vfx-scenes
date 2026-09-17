import { Shapes } from "lucide-react";
import { getRepository } from "@/lib/data";
import { GenreCard } from "@/components/cards/EntityCards";
import { EmptyState, PageHeader } from "@/components/ui/Primitives";
import { pageMetadata } from "@/lib/seo";
import styles from "@/components/layout/PageBody.module.css";

export const metadata = pageMetadata({
  title: "Genres",
  description: "Browse ScenePacks by genre: action, comedy, drama, sci-fi and more.",
  path: "/genres",
});

export default async function GenresPage() {
  const genres = await getRepository().listGenres();
  return (
    <>
      <PageHeader
        eyebrow="Browse"
        title="Genres"
        description="Find the right mood for your edit."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Genres" }]}
      />
      <div className="container">
        {genres.length === 0 ? (
          <EmptyState icon={<Shapes size={26} aria-hidden />} title="Genres are coming soon." />
        ) : (
          <div className={styles.indexGrid}>
            {genres.map((g) => (
              <GenreCard key={g.id} genre={g} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
