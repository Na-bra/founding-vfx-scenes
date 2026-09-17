import Link from "next/link";
import { Plus, Star } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";
import { resolutionFromDb } from "@/lib/data/prisma/mappers";
import { AdminPageHead, DataTable, LinkButton, Pill, SearchBox, Tabs, Thumb, dateTime, adminStyles as styles } from "@/components/admin/ui";

export const metadata = { title: "ScenePacks" };

const STATUSES = ["all", "published", "scheduled", "draft", "unpublished", "no_file"] as const;
const LABELS: Record<(typeof STATUSES)[number], string> = {
  all: "All",
  published: "Live",
  scheduled: "Scheduled",
  draft: "Drafts",
  unpublished: "Unpublished",
  no_file: "Missing file",
};

export default async function ScenePacksAdminPage({ searchParams }: PageProps<"/admin/scenepacks">) {
  await requireAdmin("scenepacks.write");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const status = (STATUSES as readonly string[]).includes(String(sp.status)) ? (sp.status as (typeof STATUSES)[number]) : "all";
  const now = new Date();

  const filters: Record<(typeof STATUSES)[number], Prisma.ScenePackWhereInput> = {
    all: {},
    published: { status: { in: ["published", "scheduled"] }, publishedAt: { lte: now } },
    scheduled: { status: "scheduled", publishedAt: { gt: now } },
    draft: { status: "draft" },
    unpublished: { status: "unpublished" },
    no_file: { storage: { none: { isCurrent: true } } },
  };
  const search: Prisma.ScenePackWhereInput = q
    ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { show: { title: { contains: q, mode: "insensitive" } } }, { slug: { contains: q.toLowerCase() } }] }
    : {};

  const db = getDb();
  const [rows, counts] = await Promise.all([
    db.scenePack.findMany({
      where: { AND: [filters[status], search] },
      orderBy: { updatedAt: "desc" },
      take: 200,
      include: { show: { select: { title: true } }, storage: { where: { isCurrent: true }, select: { provider: true } } },
    }),
    Promise.all(STATUSES.map((s) => db.scenePack.count({ where: filters[s] }))),
  ]);

  const href = (s: string) => {
    const qs = new URLSearchParams();
    if (s !== "all") qs.set("status", s);
    if (q) qs.set("q", q);
    return `/admin/scenepacks${qs.size ? `?${qs}` : ""}`;
  };

  return (
    <>
      <AdminPageHead
        title="ScenePacks"
        actions={
          <LinkButton href="/admin/scenepacks/new">
            <Plus size={16} aria-hidden /> New ScenePack
          </LinkButton>
        }
      />
      <div className={styles.toolbar}>
        <Tabs active={status} tabs={STATUSES.map((s, i) => ({ value: s, label: LABELS[s], href: href(s), count: counts[i] }))} />
        <SearchBox defaultValue={q} placeholder="Search title, show or slug" keep={{ status: status === "all" ? undefined : status }} />
      </div>
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        empty={q ? `No ScenePacks match "${q}".` : "No ScenePacks here yet."}
        columns={[
          {
            header: "ScenePack",
            cell: (r) => (
              <span className={styles.cellTitle}>
                <Thumb src={r.thumbnailUrl} />
                <span>
                  <Link href={`/admin/scenepacks/${r.id}`}>{r.title}</Link>
                  {r.featured && <Star size={13} aria-label="Featured" style={{ marginLeft: 6, color: "var(--highlight)", verticalAlign: "-1px" }} fill="currentColor" />}
                  <br />
                  <span className={styles.muted}>{r.show.title}</span>
                </span>
              </span>
            ),
          },
          {
            header: "Status",
            cell: (r) => {
              const isLive = (r.status === "published" || r.status === "scheduled") && r.publishedAt && r.publishedAt <= now;
              return <Pill value={isLive ? "published" : r.status} label={isLive ? "Live" : r.status} />;
            },
          },
          { header: "Specs", cell: (r) => <span className={`${styles.muted} ${styles.nowrap}`}>{resolutionFromDb(r.resolution)} · {r.fps} FPS · {r.clipCount} clips</span> },
          { header: "File", cell: (r) => (r.storage[0] ? <span className={styles.muted}>{r.storage[0].provider.replace("_", " ")}</span> : <Pill value="needs_attention" label="Missing" />) },
          { header: "Updated", cell: (r) => <span className={`${styles.muted} ${styles.nowrap}`}>{dateTime(r.updatedAt)}</span> },
        ]}
      />
    </>
  );
}
