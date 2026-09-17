import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";
import { AdminPageHead, DataTable, LinkButton, Pill, Thumb, dateTime, adminStyles as styles } from "@/components/admin/ui";

export const metadata = { title: "Playlists" };

export default async function PlaylistsPage() {
  await requireAdmin("curation.write");
  const rows = await getDb().playlist.findMany({ where: { ownerId: null }, orderBy: { updatedAt: "desc" }, include: { _count: { select: { items: true } } } });
  return (
    <>
      <AdminPageHead
        title="Playlists"
        description="Hand-ordered sets of ScenePacks."
        actions={
          <LinkButton href="/admin/playlists/new">
            <Plus size={16} aria-hidden /> New playlist
          </LinkButton>
        }
      />
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        empty="No playlists yet."
        columns={[
          {
            header: "Playlist",
            cell: (r) => (
              <span className={styles.cellTitle}>
                <Thumb src={r.thumbnailUrl} />
                <Link href={`/admin/playlists/${r.id}`}>{r.title}</Link>
              </span>
            ),
          },
          { header: "ScenePacks", cell: (r) => r._count.items },
          { header: "Visibility", cell: (r) => <Pill value={r.visibility === "public" ? "published" : "draft"} label={r.visibility} /> },
          { header: "Featured", cell: (r) => (r.featured ? <Pill value="featured" label="Featured" /> : <span className={styles.muted}>—</span>) },
          { header: "Updated", cell: (r) => <span className={`${styles.muted} ${styles.nowrap}`}>{dateTime(r.updatedAt)}</span> },
        ]}
      />
    </>
  );
}
