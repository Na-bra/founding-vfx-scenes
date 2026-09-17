import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";
import { AdminPageHead, DataTable, LinkButton, Pill, SearchBox, adminStyles as styles } from "@/components/admin/ui";

export const metadata = { title: "Shows" };

export default async function ShowsPage({ searchParams }: PageProps<"/admin/shows">) {
  await requireAdmin("catalog.write");
  const q = (await searchParams).q;
  const query = typeof q === "string" ? q : undefined;
  const rows = await getDb().show.findMany({
    where: query ? { title: { contains: query, mode: "insensitive" } } : {},
    orderBy: { title: "asc" },
    include: { channel: { select: { name: true } }, _count: { select: { scenePacks: true, characters: true } } },
  });

  return (
    <>
      <AdminPageHead
        title="Shows"
        actions={
          <LinkButton href="/admin/shows/new">
            <Plus size={16} aria-hidden /> New show
          </LinkButton>
        }
      />
      <div className={styles.toolbar}>
        <SearchBox defaultValue={query} placeholder="Search shows" />
      </div>
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        empty="No shows found."
        columns={[
          {
            header: "Show",
            cell: (r) => (
              <span className={styles.cellTitle}>
                <span className={styles.thumb} style={{ aspectRatio: "2 / 3", width: 34 }} aria-hidden>
                  {/* eslint-disable-next-line @next/next/no-img-element -- tiny admin thumbnail */}
                  {r.posterUrl && <img src={r.posterUrl} alt="" loading="lazy" />}
                </span>
                <Link href={`/admin/shows/${r.id}`}>{r.title}</Link>
              </span>
            ),
          },
          { header: "Channel", cell: (r) => r.channel.name },
          { header: "Years", cell: (r) => `${r.yearStart}–${r.yearEnd ?? "now"}`, className: styles.nowrap },
          { header: "Packs", cell: (r) => r._count.scenePacks },
          { header: "Characters", cell: (r) => r._count.characters },
          { header: "Status", cell: (r) => <Pill value={r.status} /> },
        ]}
      />
    </>
  );
}
