"use client";

import { startTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Search } from "lucide-react";
import styles from "@/components/admin/admin.module.css";
import { searchShowMetadata, type SearchState } from "./tmdb-actions";

/** Search TMDB and prefill the new-show form with the chosen result. */
export function TmdbSearch({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(searchShowMetadata, {} as SearchState);

  if (!configured) {
    return (
      <p className={styles.hint}>
        Add <code>TMDB_API_KEY</code> to <code>.env</code> to prefill show details, artwork and cast automatically.
      </p>
    );
  }

  return (
    <div className={styles.importPanel}>
      <form
        className={styles.addRow}
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          startTransition(() => action(data));
        }}
      >
        <div className={styles.searchBox}>
          <Search size={16} aria-hidden />
          <input name="query" placeholder="Search TMDB — e.g. Henry Danger" aria-label="Search TMDB" autoFocus />
        </div>
        <button type="submit" className={styles.secondaryButton} disabled={pending}>
          {pending ? <Loader2 size={15} className={styles.spin} aria-hidden /> : <Search size={15} aria-hidden />}
          Search
        </button>
      </form>

      {state.message && <p className={styles.hint}>{state.message}</p>}

      {state.results && state.results.length > 0 && (
        <ul className={styles.importResults}>
          {state.results.map((r) => (
            <li key={`${r.mediaType}-${r.id}`}>
              <button type="button" onClick={() => router.push(`/admin/shows/new?tmdb=${r.id}&type=${r.mediaType}`)}>
                <span className={styles.importPoster} aria-hidden>
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote TMDB thumbnail */}
                  {r.posterUrl && <img src={r.posterUrl} alt="" loading="lazy" />}
                </span>
                <span className={styles.importText}>
                  <strong>
                    {r.title} {r.year && <span className={styles.muted}>({r.year})</span>}
                  </strong>
                  <span className={styles.muted}>
                    {r.mediaType === "tv" ? "Series" : "Film"}
                    {r.overview ? ` · ${r.overview.slice(0, 110)}${r.overview.length > 110 ? "…" : ""}` : ""}
                  </span>
                </span>
                <span className={styles.secondaryButton}>
                  <Download size={14} aria-hidden /> Use
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className={styles.tmdbNote}>Data from TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
    </div>
  );
}
