import Link from "next/link";
import { ArrowRight, FlaskConical, Megaphone } from "lucide-react";
import type { Announcement } from "@/types/content";
import styles from "./AnnouncementBar.module.css";

export function AnnouncementBar({ announcements, demo }: { announcements: Announcement[]; demo: boolean }) {
  const first = announcements[0];
  if (!first && !demo) return null;

  return (
    <div className={styles.stack}>
      {demo && (
        <div className={`${styles.bar} ${styles.demo}`} role="note">
          <div className={`container ${styles.inner}`}>
            <FlaskConical size={15} aria-hidden />
            <p>
              <strong>Demo content.</strong> Shows, ScenePacks and request votes below are sample data for development.
            </p>
          </div>
        </div>
      )}
      {first && (
        <div className={`${styles.bar} ${styles[first.tone]}`} role="status">
          <div className={`container ${styles.inner}`}>
            <Megaphone size={15} aria-hidden />
            {first.href ? (
              <Link href={first.href} className={styles.link}>
                {first.message}
                <ArrowRight size={14} aria-hidden />
              </Link>
            ) : (
              <p>{first.message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
