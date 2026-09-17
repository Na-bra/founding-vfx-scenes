import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";
import { AdminPageHead, DataTable, LinkButton, SearchBox, Thumb, adminStyles as styles } from "@/components/admin/ui";

export const metadata = { title: "Characters" };

export default async function CharactersPage({ searchParams }: PageProps<"/admin/characters">) {
  await requireAdmin("catalog.write");
  const q = (await searchParams).q;
  const query = typeof q === "string" ? q : undefined;
  const rows = await getDb().character.findMany({
    where: query ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { show: { title: { contains: query, mode: "insensitive" } } }] } : {},
    orderBy: { name: "asc" },
    include: { show: { select: { title: true } }, _count: { select: { scenePacks: true } } },
  });

  return (
    <>
      <AdminPageHead
        title="Characters"
        actions={
          <LinkButton href="/admin/characters/new">
            <Plus size={16} aria-hidden /> New character
          </LinkButton>
        }
      />
      <div className={styles.toolbar}>
        <SearchBox defaultValue={query} placeholder="Search characters or shows" />
      </div>
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        empty="No characters found."
        columns={[
          {
            header: "Character",
            cell: (r) => (
              <span className={styles.cellTitle}>
                <Thumb src={r.artworkUrl} />
                <Link href={`/admin/characters/${r.id}`}>{r.name}</Link>
              </span>
            ),
          },
          { header: "Show", cell: (r) => r.show.title },
          { header: "Actor", cell: (r) => <span className={styles.muted}>{r.actor ?? "—"}</span> },
          { header: "ScenePacks", cell: (r) => r._count.scenePacks },
        ]}
      />
    </>
  );
}
