"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clapperboard, Loader2, MessageSquareDashed, Search, ThumbsUp } from "lucide-react";
import type { RequestStatus } from "@/types/content";
import styles from "./RequestSearch.module.css";

type Results = {
  scenePacks: { slug: string; title: string; show: string; resolution: string; fps: number }[];
  requests: { id: string; title: string; showTitle: string; status: RequestStatus; voteCount: number }[];
};

const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: "Pending",
  under_review: "Under review",
  planned: "Planned",
  in_progress: "In progress",
  completed: "Completed",
  published: "Published",
  declined: "Declined",
};

export function RequestSearch({ submissionsOpen, discordUrl }: { submissionsOpen: boolean; discordUrl: string | null }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const q = query.trim();

  useEffect(() => {
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/requests/similar?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (res.ok) setResults(await res.json());
      } catch {
        /* aborted or offline — keep previous results */
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [q]);

  const shown = q.length >= 2 ? results : null;
  const nothingFound = shown && shown.scenePacks.length === 0 && shown.requests.length === 0;

  return (
    <div className={styles.wrap}>
      <ol className={styles.steps} aria-label="Request steps">
        <li className={styles.stepActive}>1 · Search</li>
        <li className={shown ? styles.stepActive : undefined}>2 · Check matches</li>
        <li>3 · Request</li>
      </ol>

      <label className={styles.label} htmlFor="request-search">
        What are you looking for?
      </label>
      <div className={styles.field}>
        <Search size={20} aria-hidden className={styles.icon} />
        <input
          id="request-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Show, character or scene — e.g. Henry Danger Henry Hart"
          autoComplete="off"
          className={styles.input}
        />
        {loading && <Loader2 size={18} className={styles.spinner} aria-label="Searching" />}
      </div>

      <div aria-live="polite">
        {shown && shown.scenePacks.length > 0 && (
          <section className={styles.group}>
            <h2 className={styles.groupTitle}>
              <Clapperboard size={16} aria-hidden /> We found something similar.
            </h2>
            <ul className={styles.list}>
              {shown.scenePacks.map((p) => (
                <li key={p.slug}>
                  <Link href={`/scenepacks/${p.slug}`} className={styles.item}>
                    <span className={styles.itemText}>
                      <span className={styles.itemTitle}>{p.title}</span>
                      <span className={styles.itemSub}>
                        {p.show} · {p.resolution} · {p.fps} FPS
                      </span>
                    </span>
                    <span className={styles.itemAction}>
                      Open <ArrowRight size={15} aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {shown && shown.requests.length > 0 && (
          <section className={styles.group}>
            <h2 className={styles.groupTitle}>
              <ThumbsUp size={16} aria-hidden /> Someone already requested this.
            </h2>
            <ul className={styles.list}>
              {shown.requests.map((r) => (
                <li key={r.id}>
                  <Link href={`/requests/${r.id}`} className={styles.item}>
                    <span className={styles.votes}>{r.voteCount}</span>
                    <span className={styles.itemText}>
                      <span className={styles.itemTitle}>{r.title}</span>
                      <span className={styles.itemSub}>
                        {r.showTitle} · {STATUS_LABEL[r.status]}
                      </span>
                    </span>
                    <span className={styles.itemAction}>
                      {submissionsOpen ? "Vote for existing request" : "View request"} <ArrowRight size={15} aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {shown && (
          <section className={styles.next}>
            <MessageSquareDashed size={22} aria-hidden className={styles.nextIcon} />
            <div>
              <h2 className={styles.nextTitle}>{nothingFound ? "Nothing like this yet." : "Not what you meant?"}</h2>
              {submissionsOpen ? (
                <p>Continue to submit a new request.</p>
              ) : (
                <p>
                  Request submissions and voting open in an upcoming update.
                  {discordUrl ? (
                    <>
                      {" "}
                      Until then, share your request in the{" "}
                      <a href={discordUrl} target="_blank" rel="noopener noreferrer">
                        FoundingVFX Discord
                      </a>
                      .
                    </>
                  ) : (
                    " Check back soon."
                  )}
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
