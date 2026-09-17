import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import styles from "./Primitives.module.css";

/* ---------- Badge ---------- */

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info" | "media";

export function Badge({
  tone = "neutral",
  children,
  icon,
  mono,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  icon?: ReactNode;
  mono?: boolean;
}) {
  return (
    <span className={[styles.badge, styles[`tone-${tone}`], mono && styles.mono].filter(Boolean).join(" ")}>
      {icon}
      {children}
    </span>
  );
}

/* ---------- Section header ---------- */

export function SectionHeader({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
  id,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  id?: string;
}) {
  return (
    <div className={styles.sectionHeader}>
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id={id} className={styles.sectionTitle}>
          {title}
        </h2>
        {description && <p className={styles.sectionDescription}>{description}</p>}
      </div>
      {href && (
        <Link href={href} className={styles.sectionLink}>
          {linkLabel}
          <ArrowRight size={16} aria-hidden />
        </Link>
      )}
    </div>
  );
}

/* ---------- Breadcrumbs ---------- */

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
      <ol>
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`}>
            {item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
            {i < items.length - 1 && <ChevronRight size={14} aria-hidden />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ---------- Page header ---------- */

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className={styles.pageHeader}>
      <div className={styles.pageHeaderGlow} aria-hidden />
      <div className="container">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {description && <p className={`lead ${styles.pageHeaderLead}`}>{description}</p>}
        {actions && <div className={styles.pageHeaderActions}>{actions}</div>}
        {children}
      </div>
    </header>
  );
}

/* ---------- Empty state ---------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.empty} role="status">
      {icon && <div className={styles.emptyIcon}>{icon}</div>}
      <h3 className={styles.emptyTitle}>{title}</h3>
      {description && <p className={styles.emptyDescription}>{description}</p>}
      {action && <div className={styles.emptyAction}>{action}</div>}
    </div>
  );
}

/* ---------- Skeleton ---------- */

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <span className={[styles.skeleton, className].filter(Boolean).join(" ")} style={style} aria-hidden />;
}

export function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid-cards" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.cardSkeleton}>
          <Skeleton className={styles.cardSkeletonMedia} />
          <Skeleton style={{ height: 14, width: "40%" }} />
          <Skeleton style={{ height: 18, width: "85%" }} />
          <Skeleton style={{ height: 12, width: "60%" }} />
        </div>
      ))}
    </div>
  );
}

/* ---------- Metadata list ---------- */

export function MetaGrid({ items }: { items: { label: string; value: ReactNode; icon?: ReactNode }[] }) {
  return (
    <dl className={styles.metaGrid}>
      {items.map((item) => (
        <div key={item.label} className={styles.metaItem}>
          <dt>
            {item.icon}
            {item.label}
          </dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------- Chip link ---------- */

export function ChipLink({ href, children, active }: { href: string; children: ReactNode; active?: boolean }) {
  return (
    <Link href={href} className={[styles.chip, active && styles.chipActive].filter(Boolean).join(" ")}>
      {children}
    </Link>
  );
}
