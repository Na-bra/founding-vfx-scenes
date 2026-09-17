import type { ReactNode } from "react";
import Link from "next/link";
import { FoundingMark } from "@/components/icons/BrandIcons";
import styles from "@/components/admin/admin.module.css";

export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className={styles.authWrap}>
      <div className={styles.authCard}>
        <Link href="/" className={styles.brand} style={{ padding: 0 }}>
          <FoundingMark size={30} /> FoundingVFX
          <span className={styles.brandTag}>Admin</span>
        </Link>
        <h1 className={styles.authTitle}>{title}</h1>
        {children}
      </div>
    </main>
  );
}
