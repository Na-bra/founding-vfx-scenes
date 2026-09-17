import { siteConfig } from "@/config/site";
import { features } from "@/config/features";
import { RequestSearch } from "@/components/requests/RequestSearch";
import { PageHeader } from "@/components/ui/Primitives";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Request a ScenePack",
  description: "Search existing ScenePacks and requests, then request what's missing.",
  path: "/requests/new",
});

export default function NewRequestPage() {
  const discord = siteConfig.social.find((s) => s.id === "discord")?.href ?? null;
  return (
    <>
      <PageHeader
        eyebrow="Request a ScenePack"
        title="What should we make next?"
        description="Search first — the ScenePack may already exist, or someone may have requested it already."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Requests", href: "/requests" }, { label: "New request" }]}
      />
      <div className="container" style={{ maxWidth: 820 }}>
        <RequestSearch submissionsOpen={features.requestSubmissions} discordUrl={discord} />
      </div>
    </>
  );
}
