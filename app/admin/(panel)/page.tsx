import Link from "next/link";
import { Plus, ShieldAlert } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { can } from "@/lib/admin/permissions";
import { getDb } from "@/lib/db";
import { AdminPageHead, dateTime, LinkButton, adminStyles as styles } from "@/components/admin/ui";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  const admin = await requireAdmin();
  const denied = (await searchParams).denied;
  const db = getDb();
  const now = new Date();

  const [published, drafts, scheduled, shows, channels, pendingRequests, openRequests, openReports, recent, audit] = await Promise.all([
    db.scenePack.count({ where: { status: { in: ["published", "scheduled"] }, publishedAt: { lte: now } } }),
    db.scenePack.count({ where: { status: "draft" } }),
    db.scenePack.count({ where: { status: "scheduled", publishedAt: { gt: now } } }),
    db.show.count(),
    db.channel.count(),
    db.sceneRequest.count({ where: { status: "pending", mergedIntoId: null } }),
    db.sceneRequest.count({ where: { status: { in: ["pending", "under_review", "planned", "in_progress"] }, mergedIntoId: null } }),
    db.report.count({ where: { status: "open" } }),
    db.scenePack.findMany({ orderBy: { updatedAt: "desc" }, take: 6, select: { id: true, title: true, status: true, updatedAt: true } }),
    can(admin.role, "audit.read")
      ? db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { actor: { select: { email: true } } } })
      : [],
  ]);

  const stat = (label: string, value: number, href?: string, sub?: string, alert = false) => {
    const body = (
      <>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statValue}>{value.toLocaleString("en-US")}</span>
        {sub && <span className={styles.statSub}>{sub}</span>}
      </>
    );
    const cls = `${styles.stat} ${alert && value > 0 ? styles.statAlert : ""}`;
    return href ? (
      <Link href={href} className={cls}>
        {body}
      </Link>
    ) : (
      <div className={cls}>{body}</div>
    );
  };

  return (
    <>
      {denied && (
        <p className={styles.notice} role="alert">
          <ShieldAlert size={18} aria-hidden /> Your role doesn&rsquo;t have access to that page.
        </p>
      )}
      {process.env.DATA_SOURCE !== "database" && (
        <p className={styles.notice} role="alert">
          <ShieldAlert size={18} aria-hidden /> The public site is using demo data (DATA_SOURCE isn&rsquo;t &ldquo;database&rdquo;), so changes here won&rsquo;t appear on it.
        </p>
      )}
      <AdminPageHead
        title="Dashboard"
        description={`Signed in as ${admin.email}`}
        actions={
          can(admin.role, "scenepacks.write") && (
            <LinkButton href="/admin/scenepacks/new">
              <Plus size={16} aria-hidden /> New ScenePack
            </LinkButton>
          )
        }
      />

      <div className={styles.statGrid}>
        {stat("Live ScenePacks", published, "/admin/scenepacks?status=published")}
        {stat("Drafts", drafts, "/admin/scenepacks?status=draft")}
        {stat("Scheduled", scheduled, "/admin/scenepacks?status=scheduled")}
        {stat("Shows", shows, "/admin/shows")}
        {stat("Channels", channels, "/admin/channels")}
        {stat("Pending requests", pendingRequests, "/admin/requests?status=pending", `${openRequests} open in total`, true)}
        {stat("Open reports", openReports, "/admin/reports", undefined, true)}
      </div>

      <div className={styles.twoCol}>
        <section className={styles.panel} aria-labelledby="recent-title">
          <div className={styles.panelHead}>
            <h2 id="recent-title" className={styles.panelTitle}>
              Recently edited ScenePacks
            </h2>
            <Link href="/admin/scenepacks" className={styles.ghostButton}>
              All
            </Link>
          </div>
          <table className={styles.table}>
            <tbody>
              {recent.length === 0 && (
                <tr>
                  <td className={styles.emptyRow}>No ScenePacks yet.</td>
                </tr>
              )}
              {recent.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/scenepacks/${p.id}`}>{p.title}</Link>
                  </td>
                  <td className={styles.nowrap}>
                    <span className={`${styles.pill} ${styles[`pill-${p.status}`]}`}>{p.status}</span>
                  </td>
                  <td className={`${styles.muted} ${styles.nowrap}`}>{dateTime(p.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {can(admin.role, "audit.read") && (
          <section className={styles.panel} aria-labelledby="audit-title">
            <div className={styles.panelHead}>
              <h2 id="audit-title" className={styles.panelTitle}>
                Recent activity
              </h2>
              <Link href="/admin/audit" className={styles.ghostButton}>
                Audit log
              </Link>
            </div>
            <table className={styles.table}>
              <tbody>
                {audit.length === 0 && (
                  <tr>
                    <td className={styles.emptyRow}>No admin activity yet.</td>
                  </tr>
                )}
                {audit.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.actor?.email ?? "Deleted user"}</strong> <span className={styles.muted}>{a.action.replace(/[._]/g, " ")}</span>{" "}
                      {(a.changes as { label?: string } | null)?.label}
                    </td>
                    <td className={`${styles.muted} ${styles.nowrap}`}>{dateTime(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </>
  );
}
