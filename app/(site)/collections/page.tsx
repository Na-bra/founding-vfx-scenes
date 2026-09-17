import { LibraryBig } from "lucide-react";
import { getRepository } from "@/lib/data";
import { CollectionCard } from "@/components/cards/EntityCards";
import { EmptyState, PageHeader } from "@/components/ui/Primitives";
import { pageMetadata } from "@/lib/seo";
import styles from "@/components/layout/PageBody.module.css";

export const metadata = pageMetadata({
  title: "Collections",
  description: "Collections group shows, playlists and ScenePacks around a network, era or theme.",
  path: "/collections",
});

export default async function CollectionsPage() {
  const collections = await getRepository().listCollections();
  return (
    <>
      <PageHeader
        eyebrow="Curated"
        title="Collections"
        description="Bigger than a playlist: shows, playlists and ScenePacks grouped around a network, era or theme."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Collections" }]}
      />
      <div className="container">
        {collections.length === 0 ? (
          <EmptyState icon={<LibraryBig size={26} aria-hidden />} title="Collections are coming soon." />
        ) : (
          <div className={styles.twoCol}>
            {collections.map((c) => (
              <CollectionCard key={c.id} collection={c} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
