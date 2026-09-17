import type { ReactNode } from "react";
import styles from "./StatusScreen.module.css";

/** Full-section state for 404s, errors and unavailable downloads. */
export function StatusScreen({
  code,
  icon,
  title,
  description,
  actions,
  children,
}: {
  code?: string;
  icon: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className={styles.wrap}>
      <div className={styles.backdrop} aria-hidden>
        {code && <span className={styles.code}>{code}</span>}
      </div>
      <div className={`container ${styles.content}`}>
        <div className={styles.icon}>{icon}</div>
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
        {actions && <div className={styles.actions}>{actions}</div>}
        {children}
      </div>
    </section>
  );
}
