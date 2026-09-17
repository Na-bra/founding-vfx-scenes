import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./Pagination.module.css";

type Props = {
  page: number;
  pageCount: number;
  basePath: string;
  params: Record<string, string | undefined>;
};

function pageItems(page: number, count: number): (number | "gap")[] {
  const pages = new Set([1, count, page - 1, page, page + 1].filter((p) => p >= 1 && p <= count));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

export function Pagination({ page, pageCount, basePath, params }: Props) {
  if (pageCount <= 1) return null;

  const href = (p: number) => {
    const qs = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => Boolean(e[1])));
    if (p > 1) qs.set("page", String(p));
    else qs.delete("page");
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <nav aria-label="Pagination" className={styles.nav}>
      {page > 1 ? (
        <Link href={href(page - 1)} className={styles.step} rel="prev">
          <ChevronLeft size={18} aria-hidden /> <span>Previous</span>
        </Link>
      ) : (
        <span className={`${styles.step} ${styles.disabled}`} aria-disabled="true">
          <ChevronLeft size={18} aria-hidden /> <span>Previous</span>
        </span>
      )}
      <ol className={styles.pages}>
        {pageItems(page, pageCount).map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} className={styles.gap} aria-hidden>
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={href(p)}
                className={`${styles.page} ${p === page ? styles.current : ""}`}
                aria-current={p === page ? "page" : undefined}
                aria-label={`Page ${p}`}
              >
                {p}
              </Link>
            </li>
          ),
        )}
      </ol>
      {page < pageCount ? (
        <Link href={href(page + 1)} className={styles.step} rel="next">
          <span>Next</span> <ChevronRight size={18} aria-hidden />
        </Link>
      ) : (
        <span className={`${styles.step} ${styles.disabled}`} aria-disabled="true">
          <span>Next</span> <ChevronRight size={18} aria-hidden />
        </span>
      )}
    </nav>
  );
}
