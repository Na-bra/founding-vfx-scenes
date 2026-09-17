import { Tv } from "lucide-react";
import { getRepository } from "@/lib/data";
import { ShowCard } from "@/components/cards/EntityCards";
import { EmptyState, PageHeader } from "@/components/ui/Primitives";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Shows",
  description: "Browse shows and films with ScenePacks on FoundingVFX.",
  path: "/shows",
});

export default async function ShowsPage() {
  const shows = await getRepository().listShows();

  return (
    <>
      <PageHeader
        eyebrow="Browse"
        title="Shows"
        description="Pick a show to see its seasons, characters and every ScenePack we have for it."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Shows" }]}
      />
      <div className="container">
        {shows.length === 0 ? (
          <EmptyState icon={<Tv size={26} aria-hidden />} title="Shows are coming soon." />
        ) : (
          <div className="grid-posters">
            {shows.map((s, i) => (
              <ShowCard key={s.id} show={s} priority={i < 6} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
