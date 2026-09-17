import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/Primitives";
import { FavoritesList } from "./FavoritesList";

export const metadata = pageMetadata({ title: "My Favorites", path: "/favorites", noIndex: true });

export default function FavoritesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Your library"
        title="My Favorites"
        description="ScenePacks you've favorited. They're saved in this browser on this device."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Favorites" }]}
      />
      <div className="container">
        <FavoritesList />
      </div>
    </>
  );
}
