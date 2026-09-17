import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";
import { AdminPageHead, DataTable, SearchBox, dateTime, adminStyles as styles } from "@/components/admin/ui";

export const metadata = { title: "Audit log" };

const TARGET_LINKS: Record<string, string> = {
  scenepack: "/admin/scenepacks/",
  show: "/admin/shows/",
  character: "/admin/characters/",
  channel: "/admin/channels/",
  genre: "/admin/genres/",
  playlist: "/admin/playlists/",
  collection: "/admin/collections/",
  request: "/admin/requests/",
};

type Changes = { label?: string | null; fields?: Record<string, unknown> } | null;

function describe(fields: Record<string, unknown> | undefined) {
  if (!fields || Object.keys(fields).length === 0) return null;
  return Object.entries(fields)
    .map(([k, v]) => {
      if (v === "changed" || typeof v !== "object" || v === null) return k;
      const { from, to } = v as { from?: unknown; to?: unknown };
      const show = (x: unknown) => (x === "…" || x === undefined ? "" : String(x));
      return show(from) || show(to) ? `${k}: ${show(from) || "∅"} → ${show(to) || "∅"}` : k;
    })
    .join(" · ");
}

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  await requireAdmin("audit.read");
  const q = (await searchParams).q;
  const query = typeof q === "string" ? q : undefined;
  const rows = await getDb().auditLog.findMany({
    where: query ? { OR: [{ action: { contains: query, mode: "insensitive" } }, { actor: { email: { contains: query, mode: "insensitive" } } }, { targetId: query }] } : {},
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { actor: { select: { email: true } } },
  });

  return (
    <>
      <AdminPageHead title="Audit log" description="Every admin change. Download links are recorded as changed without storing the link." />
      <div className={styles.toolbar}>
        <SearchBox defaultValue={query} placeholder="Filter by action or admin email" />
      </div>
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        empty="No activity yet."
        columns={[
          { header: "When", cell: (r) => <span className={`${styles.muted} ${styles.nowrap}`}>{dateTime(r.createdAt)}</span> },
          { header: "Admin", cell: (r) => r.actor?.email ?? <span className={styles.muted}>Removed user</span> },
          { header: "Action", cell: (r) => <code className={styles.nowrap}>{r.action}</code> },
          {
            header: "Target",
            cell: (r) => {
              const label = (r.changes as Changes)?.label ?? r.targetId;
              const base = TARGET_LINKS[r.targetType];
              return base && !r.action.endsWith(".delete") ? <Link href={`${base}${r.targetId}`}>{label}</Link> : label;
            },
          },
          { header: "Changes", cell: (r) => <span className={styles.muted}>{describe((r.changes as Changes)?.fields) ?? "—"}</span> },
        ]}
      />
    </>
  );
}
