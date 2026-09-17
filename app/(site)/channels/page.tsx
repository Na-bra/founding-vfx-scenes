import { Layers } from "lucide-react";
import { getRepository } from "@/lib/data";
import { ChannelCard } from "@/components/cards/EntityCards";
import { EmptyState, PageHeader } from "@/components/ui/Primitives";
import { pageMetadata } from "@/lib/seo";
import styles from "@/components/layout/PageBody.module.css";

export const metadata = pageMetadata({
  title: "Channels",
  description: "Browse ScenePacks by TV channel and streaming platform.",
  path: "/channels",
});

export default async function ChannelsPage() {
  const channels = await getRepository().listChannels();
  return (
    <>
      <PageHeader
        eyebrow="Browse"
        title="Channels"
        description="Networks and streaming platforms, each with their shows and ScenePacks."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Channels" }]}
      />
      <div className="container">
        {channels.length === 0 ? (
          <EmptyState icon={<Layers size={26} aria-hidden />} title="Channels are coming soon." />
        ) : (
          <div className={styles.indexGrid}>
            {channels.map((c) => (
              <ChannelCard key={c.id} channel={c} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
