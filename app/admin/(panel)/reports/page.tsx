import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";
import { ActionButton } from "@/components/admin/FormKit";
import { AdminPageHead, DataTable, Pill, Tabs, dateTime, adminStyles as styles } from "@/components/admin/ui";
import { setReportStatus } from "../community-actions";

export const metadata = { title: "Reports" };

const REASONS: Record<string, string> = {
  broken_download: "Broken download",
  incorrect_information: "Incorrect information",
  incorrect_thumbnail: "Incorrect thumbnail",
  duplicate: "Duplicate",
  other: "Other",
};

export default async function ReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  await requireAdmin("community.moderate");
  const sp = await searchParams;
  const status = sp.status === "resolved" || sp.status === "dismissed" ? sp.status : "open";
  const db = getDb();
  const [rows, counts] = await Promise.all([
    db.report.findMany({ where: { status }, orderBy: { createdAt: "desc" }, take: 200, include: { scenePack: { select: { id: true, title: true, slug: true } } } }),
    Promise.all((["open", "resolved", "dismissed"] as const).map((s) => db.report.count({ where: { status: s } }))),
  ]);

  return (
    <>
      <AdminPageHead title="Reports" description="Problems visitors flagged on ScenePack pages." />
      <div className={styles.toolbar}>
        <Tabs
          active={status}
          tabs={[
            { value: "open", label: "Open", count: counts[0], href: "/admin/reports" },
            { value: "resolved", label: "Resolved", count: counts[1], href: "/admin/reports?status=resolved" },
            { value: "dismissed", label: "Dismissed", count: counts[2], href: "/admin/reports?status=dismissed" },
          ]}
        />
      </div>
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        empty={status === "open" ? "No open reports. 🎉" : "Nothing here."}
        columns={[
          {
            header: "ScenePack",
            cell: (r) => (
              <span>
                <Link href={`/admin/scenepacks/${r.scenePack.id}`} style={{ fontWeight: 600 }}>
                  {r.scenePack.title}
                </Link>
                <br />
                <Link href={`/scenepacks/${r.scenePack.slug}`} target="_blank" className={styles.muted}>
                  View page ↗
                </Link>
              </span>
            ),
          },
          { header: "Reason", cell: (r) => <Pill value={r.reason === "broken_download" ? "needs_attention" : "pending"} label={REASONS[r.reason]} /> },
          { header: "Details", cell: (r) => <span style={{ whiteSpace: "pre-wrap" }}>{r.details || <span className={styles.muted}>—</span>}</span> },
          { header: "Reported", cell: (r) => <span className={`${styles.muted} ${styles.nowrap}`}>{dateTime(r.createdAt)}</span> },
          {
            header: "",
            cell: (r) => (
              <div className={styles.rowActions}>
                {r.status === "open" ? (
                  <>
                    <ActionButton action={setReportStatus} fields={{ id: r.id, status: "resolved" }} label="Resolve" tone="primary" />
                    <ActionButton action={setReportStatus} fields={{ id: r.id, status: "dismissed" }} label="Dismiss" />
                  </>
                ) : (
                  <ActionButton action={setReportStatus} fields={{ id: r.id, status: "open" }} label="Reopen" />
                )}
              </div>
            ),
          },
        ]}
      />
    </>
  );
}
