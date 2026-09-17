import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";
import { AdminPageHead, DataTable, LinkButton, Pill, Thumb, dateTime, adminStyles as styles } from "@/components/admin/ui";

export const metadata = { title: "Collections" };

export default async function CollectionsPage() {
  await requireAdmin("curation.write");
  const rows = await getDb().collection.findMany({ orderBy: { updatedAt: "desc" }, include: { _count: { select: { items: true } } } });
  return (
    <>
      <AdminPageHead
        title="Collections"
        description="Group shows, playlists and ScenePacks around a network, era or theme."
        actions={
          <LinkButton href="/admin/collections/new">
            <Plus size={16} aria-hidden /> New collection
          </LinkButton>
        }
      />
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        empty="No collections yet."
        columns={[
          {
            header: "Collection",
            cell: (r) => (
              <span className={styles.cellTitle}>
                <Thumb src={r.artworkUrl} />
                <Link href={`/admin/collections/${r.id}`}>{r.title}</Link>
              </span>
            ),
          },
          { header: "Items", cell: (r) => r._count.items },
          { header: "Featured", cell: (r) => (r.featured ? <Pill value="featured" label="Featured" /> : <span className={styles.muted}>—</span>) },
          { header: "Updated", cell: (r) => <span className={`${styles.muted} ${styles.nowrap}`}>{dateTime(r.updatedAt)}</span> },
        ]}
      />
    </>
  );
}
