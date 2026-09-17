import { getRepository } from "@/lib/data";
import { EmptyState, PageHeader } from "@/components/ui/Primitives";
import { formatDate, formatMonth } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import styles from "./changelog.module.css";

export const metadata = pageMetadata({ title: "What's New", description: "Recent changes to FoundingVFX.", path: "/changelog" });

export default async function ChangelogPage() {
  const entries = await getRepository().getChangelog();
  return (
    <>
      <PageHeader
        eyebrow="Changelog"
        title="What's New"
        description="Every meaningful change to the FoundingVFX platform."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "What's new" }]}
      />
      <div className="container">
        {entries.length === 0 ? (
          <EmptyState title="No updates yet." />
        ) : (
          <ol className={styles.list}>
            {entries.map((e) => (
              <li key={e.id} className={styles.entry}>
                <div className={styles.when}>
                  <p className={styles.month}>{formatMonth(e.date)}</p>
                  <time dateTime={e.date} className={styles.date}>
                    {formatDate(e.date)}
                  </time>
                </div>
                <div className={styles.card}>
                  <h2 className={styles.title}>{e.title}</h2>
                  <ul className={styles.changes}>
                    {e.changes.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
