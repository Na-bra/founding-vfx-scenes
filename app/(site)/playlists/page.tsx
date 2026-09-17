import { ListVideo } from "lucide-react";
import { getRepository } from "@/lib/data";
import { PlaylistCard } from "@/components/cards/EntityCards";
import { EmptyState, PageHeader } from "@/components/ui/Primitives";
import { pageMetadata } from "@/lib/seo";
import styles from "@/components/layout/PageBody.module.css";

export const metadata = pageMetadata({
  title: "Playlists",
  description: "Curated playlists of ScenePacks from the FoundingVFX team.",
  path: "/playlists",
});

export default async function PlaylistsPage() {
  const playlists = await getRepository().listPlaylists();
  const ordered = [...playlists].sort((a, b) => Number(b.featured) - Number(a.featured));
  return (
    <>
      <PageHeader
        eyebrow="Curated"
        title="Playlists"
        description="Hand-arranged sets of ScenePacks around a theme, mood or character type."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Playlists" }]}
      />
      <div className="container">
        {ordered.length === 0 ? (
          <EmptyState icon={<ListVideo size={26} aria-hidden />} title="Playlists are coming soon." />
        ) : (
          <div className={styles.twoCol}>
            {ordered.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
