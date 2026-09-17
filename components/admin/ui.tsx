import Link from "next/link";
import type { ReactNode } from "react";
import { Search } from "lucide-react";
import styles from "./admin.module.css";

export { styles as adminStyles };

export function AdminPageHead({
  title,
  description,
  crumbs,
  actions,
}: {
  title: string;
  description?: string;
  crumbs?: { label: string; href: string }[];
  actions?: ReactNode;
}) {
  return (
    <header className={styles.pageHead}>
      <div>
        {crumbs && (
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            {crumbs.map((c) => (
              <span key={c.href}>
                <Link href={c.href}>{c.label}</Link> /
              </span>
            ))}
          </nav>
        )}
        <h1 className={styles.pageTitle}>{title}</h1>
        {description && <p className={styles.pageDescription}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}

export function Pill({ value, label }: { value: string; label?: string }) {
  return <span className={`${styles.pill} ${styles[`pill-${value}`] ?? ""}`}>{label ?? value.replace(/_/g, " ")}</span>;
}

export function LinkButton({ href, children, tone = "primary" }: { href: string; children: ReactNode; tone?: "primary" | "secondary" }) {
  return (
    <Link href={href} className={tone === "primary" ? styles.primaryButton : styles.secondaryButton}>
      {children}
    </Link>
  );
}

export type Column<T> = { header: string; cell: (row: T) => ReactNode; className?: string };

export function DataTable<T>({ columns, rows, rowKey, empty }: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string; empty: string }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i} scope="col">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.emptyRow}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((c, i) => (
                  <td key={i} className={c.className}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/** GET search form that keeps other query params (e.g. status tab). */
export function SearchBox({ defaultValue, placeholder, keep }: { defaultValue?: string; placeholder: string; keep?: Record<string, string | undefined> }) {
  return (
    <form className={styles.searchBox} role="search">
      <Search size={16} aria-hidden />
      {Object.entries(keep ?? {}).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <input type="search" name="q" defaultValue={defaultValue} placeholder={placeholder} aria-label={placeholder} />
    </form>
  );
}

export function Tabs({ tabs, active }: { tabs: { value: string; label: string; href: string; count?: number }[]; active: string }) {
  return (
    <nav className={styles.tabs} aria-label="Filter">
      {tabs.map((t) => (
        <Link key={t.value} href={t.href} className={`${styles.tab} ${t.value === active ? styles.tabActive : ""}`} aria-current={t.value === active ? "page" : undefined}>
          {t.label}
          {t.count !== undefined && <span>{t.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function Thumb({ src }: { src?: string | null }) {
  return (
    <span className={styles.thumb} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny admin thumbnails */}
      {src && <img src={src} alt="" loading="lazy" />}
    </span>
  );
}

export const dateTime = (d: Date | null | undefined) =>
  d ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(d) + " UTC" : "—";
