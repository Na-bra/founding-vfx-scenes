"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import styles from "./admin.module.css";

export type NavItem = { href: string; label: string; icon: ReactNode; badge?: number; group: string };

export function AdminNav({ items, header, footer }: { items: NavItem[]; header: ReactNode; footer: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const groups = [...new Set(items.map((i) => i.group))];

  return (
    <>
      <button type="button" className={`${styles.iconButton} ${styles.menuToggle}`} onClick={() => setOpen(true)} aria-label="Open admin menu">
        <Menu size={20} />
      </button>
      {open && <div className={styles.scrim} onClick={() => setOpen(false)} aria-hidden />}
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`} aria-label="Admin" {...(open ? { role: "dialog", "aria-modal": true } : {})}>
        <div className={styles.sidebarHeader}>
          {header}
          <button type="button" className={`${styles.iconButton} ${styles.sidebarClose}`} onClick={() => setOpen(false)} aria-label="Close admin menu">
            <X size={18} />
          </button>
        </div>
        <nav>
          {groups.map((g) => (
            <div key={g}>
              {g && <p className={styles.navGroup}>{g}</p>}
              {items
                .filter((i) => i.group === g)
                .map((item) => {
                  const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                  return (
                    <Link key={item.href} href={item.href} className={`${styles.navLink} ${active ? styles.navActive : ""}`} aria-current={active ? "page" : undefined}>
                      {item.icon}
                      {item.label}
                      {item.badge ? <span className={styles.navBadge}>{item.badge}</span> : null}
                    </Link>
                  );
                })}
            </div>
          ))}
        </nav>
        {footer}
      </aside>
    </>
  );
}
