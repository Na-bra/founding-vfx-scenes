import Link from "next/link";
import { Flame } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";
import { ActionButton } from "@/components/admin/FormKit";
import { AdminPageHead, DataTable, Pill, SearchBox, Tabs, dateTime, adminStyles as styles } from "@/components/admin/ui";
import { setRequestStatus } from "../community-actions";

export const metadata = { title: "Requests" };

const TABS = ["pending", "under_review", "planned", "in_progress", "completed", "published", "declined", "all"] as const;
const LABEL: Record<(typeof TABS)[number], string> = {
  pending: "Pending",
  under_review: "Under review",
  planned: "Planned",
  in_progress: "In progress",
  completed: "Completed",
  published: "Published",
  declined: "Declined",
  all: "All",
};

export default async function RequestsAdminPage({ searchParams }: PageProps<"/admin/requests">) {
  await requireAdmin("community.moderate");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const status = (TABS as readonly string[]).includes(String(sp.status)) ? (sp.status as (typeof TABS)[number]) : "pending";
  const db = getDb();

  const base: Prisma.SceneRequestWhereInput = { mergedIntoId: null };
  const where: Prisma.SceneRequestWhereInput = {
    ...base,
    ...(status !== "all" && { status }),
    ...(q && { OR: [{ title: { contains: q, mode: "insensitive" } }, { showTitle: { contains: q, mode: "insensitive" } }, { characterName: { contains: q, mode: "insensitive" } }] }),
  };
  const [rows, counts] = await Promise.all([
    db.sceneRequest.findMany({ where, orderBy: [{ highPriority: "desc" }, { voteCount: "desc" }, { createdAt: "desc" }], take: 200 }),
    Promise.all(TABS.map((t) => db.sceneRequest.count({ where: { ...base, ...(t !== "all" && { status: t }) } }))),
  ]);

  return (
    <>
      <AdminPageHead title="Request queue" description="Sorted by priority, then votes. Open a request to edit details or link the ScenePack that fulfils it." />
      <div className={styles.toolbar}>
        <Tabs
          active={status}
          tabs={TABS.map((t, i) => ({ value: t, label: LABEL[t], count: counts[i], href: `/admin/requests?status=${t}${q ? `&q=${encodeURIComponent(q)}` : ""}` }))}
        />
        <SearchBox defaultValue={q} placeholder="Search requests" keep={{ status }} />
      </div>
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        empty="No requests here."
        columns={[
          {
            header: "Request",
            cell: (r) => (
              <span>
                <Link href={`/admin/requests/${r.id}`} style={{ fontWeight: 600 }}>
                  {r.title}
                </Link>
                {r.highPriority && <Flame size={13} aria-label="High priority" style={{ marginLeft: 6, color: "var(--accent)" }} />}
                <br />
                <span className={styles.muted}>
                  {r.showTitle}
                  {r.characterName && ` · ${r.characterName}`}
                </span>
              </span>
            ),
          },
          { header: "Votes", cell: (r) => <strong>{r.voteCount}</strong> },
          { header: "Status", cell: (r) => <Pill value={r.status} /> },
          { header: "Requested", cell: (r) => <span className={`${styles.muted} ${styles.nowrap}`}>{dateTime(r.createdAt)}</span> },
          {
            header: "",
            cell: (r) => (
              <div className={styles.rowActions}>
                {r.status === "pending" && <ActionButton action={setRequestStatus} fields={{ id: r.id, status: "under_review" }} label="Review" />}
                {(r.status === "pending" || r.status === "under_review") && <ActionButton action={setRequestStatus} fields={{ id: r.id, status: "planned" }} label="Plan" />}
                {r.status === "planned" && <ActionButton action={setRequestStatus} fields={{ id: r.id, status: "in_progress" }} label="Start" />}
                {r.status === "in_progress" && <ActionButton action={setRequestStatus} fields={{ id: r.id, status: "completed" }} label="Complete" />}
                {!["declined", "completed", "published"].includes(r.status) && (
                  <ActionButton action={setRequestStatus} fields={{ id: r.id, status: "declined" }} label="Decline" tone="danger" confirm={`Decline "${r.title}"?`} />
                )}
              </div>
            ),
          },
        ]}
      />
    </>
  );
}
