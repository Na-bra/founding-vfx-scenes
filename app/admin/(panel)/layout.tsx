import Link from "next/link";
import {
  Clapperboard,
  ExternalLink,
  Flag,
  History,
  Inbox,
  Layers,
  LayoutDashboard,
  LibraryBig,
  ListVideo,
  LogOut,
  Megaphone,
  Shapes,
  Sparkles,
  Tag,
  Tv,
  User,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { can, ROLE_LABELS } from "@/lib/admin/permissions";
import { getDb } from "@/lib/db";
import { AdminNav, type NavItem } from "@/components/admin/AdminNav";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { FoundingMark } from "@/components/icons/BrandIcons";
import styles from "@/components/admin/admin.module.css";
import { logout } from "../auth-actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  const db = getDb();
  const [pendingRequests, openReports] = await Promise.all([
    can(admin.role, "community.moderate") ? db.sceneRequest.count({ where: { status: "pending", mergedIntoId: null } }) : 0,
    can(admin.role, "community.moderate") ? db.report.count({ where: { status: "open" } }) : 0,
  ]);

  const i = (Icon: typeof Tv) => <Icon size={17} aria-hidden />;
  const items: (NavItem & { show: boolean })[] = [
    { href: "/admin", label: "Dashboard", icon: i(LayoutDashboard), group: "", show: true },
    { href: "/admin/scenepacks", label: "ScenePacks", icon: i(Clapperboard), group: "Content", show: can(admin.role, "scenepacks.write") },
    { href: "/admin/shows", label: "Shows", icon: i(Tv), group: "Content", show: can(admin.role, "catalog.write") },
    { href: "/admin/characters", label: "Characters", icon: i(User), group: "Content", show: can(admin.role, "catalog.write") },
    { href: "/admin/channels", label: "Channels", icon: i(Layers), group: "Content", show: can(admin.role, "taxonomy.write") },
    { href: "/admin/genres", label: "Genres", icon: i(Shapes), group: "Content", show: can(admin.role, "taxonomy.write") },
    { href: "/admin/tags", label: "Tags", icon: i(Tag), group: "Content", show: can(admin.role, "catalog.write") },
    { href: "/admin/playlists", label: "Playlists", icon: i(ListVideo), group: "Curation", show: can(admin.role, "curation.write") },
    { href: "/admin/collections", label: "Collections", icon: i(LibraryBig), group: "Curation", show: can(admin.role, "curation.write") },
    { href: "/admin/requests", label: "Requests", icon: i(Inbox), badge: pendingRequests, group: "Community", show: can(admin.role, "community.moderate") },
    { href: "/admin/reports", label: "Reports", icon: i(Flag), badge: openReports, group: "Community", show: can(admin.role, "community.moderate") },
    { href: "/admin/announcements", label: "Announcements", icon: i(Megaphone), group: "Site", show: can(admin.role, "site.write") },
    { href: "/admin/changelog", label: "Changelog", icon: i(Sparkles), group: "Site", show: can(admin.role, "site.write") },
    { href: "/admin/users", label: "Admins", icon: i(Users), group: "Site", show: can(admin.role, "users.manage") },
    { href: "/admin/audit", label: "Audit log", icon: i(History), group: "Site", show: can(admin.role, "audit.read") },
  ];

  return (
    <div className={styles.shell}>
      <AdminNav
        items={items.filter((x) => x.show).map((x) => ({ href: x.href, label: x.label, icon: x.icon, badge: x.badge, group: x.group }))}
        header={
          <Link href="/admin" className={styles.brand}>
            <FoundingMark size={26} /> FoundingVFX <span className={styles.brandTag}>Admin</span>
          </Link>
        }
        footer={
          <div className={styles.sidebarFooter}>
            <div className={styles.who}>
              <span className={styles.whoEmail}>{admin.email}</span>
              <span className={styles.whoRole}>{ROLE_LABELS[admin.role]}</span>
            </div>
            <form action={logout}>
              <button type="submit" className={styles.ghostButton} style={{ width: "100%", justifyContent: "flex-start" }}>
                <LogOut size={16} aria-hidden /> Sign out
              </button>
            </form>
          </div>
        }
      />
      <div className={styles.main}>
        <div className={styles.topbar}>
          <span className={styles.topbarSpacer} />
          <Link href="/" target="_blank" className={styles.ghostButton}>
            View site <ExternalLink size={14} aria-hidden />
          </Link>
          <ThemeToggle />
        </div>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
