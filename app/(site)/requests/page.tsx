import Link from "next/link";
import { Inbox, MessageSquarePlus } from "lucide-react";
import { getRepository } from "@/lib/data";
import { REQUEST_TABS, type RequestTab } from "@/lib/data/repository";
import { RequestCard } from "@/components/requests/RequestCard";
import { Button } from "@/components/ui/Button";
import { ChipLink, EmptyState } from "@/components/ui/Primitives";
import { pageMetadata } from "@/lib/seo";
import styles from "./requests.module.css";

export const metadata = pageMetadata({
  title: "Requests",
  description: "See what the FoundingVFX community wants next and request new ScenePacks.",
  path: "/requests",
});

const TAB_LABELS: Record<RequestTab, string> = {
  popular: "Popular",
  new: "New",
  in_progress: "In Progress",
  completed: "Completed",
  planned: "Planned",
};

const TAB_ORDER: RequestTab[] = ["popular", "new", "in_progress", "completed", "planned"];

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function RequestsPage({ searchParams }: PageProps<"/requests">) {
  const sp = await searchParams;
  const tabParam = one(sp.tab);
  const tab: RequestTab = (REQUEST_TABS as readonly string[]).includes(tabParam ?? "") ? (tabParam as RequestTab) : "popular";
  const channel = one(sp.channel)?.match(/^[a-z0-9-]+$/)?.[0];
  const genre = one(sp.genre)?.match(/^[a-z0-9-]+$/)?.[0];

  const repo = getRepository();
  const [requests, channels, genres] = await Promise.all([
    repo.listRequests({ tab, channel, genre }),
    repo.listChannels(),
    repo.listGenres(),
  ]);

  const href = (next: { tab?: RequestTab; channel?: string | null; genre?: string | null }) => {
    const qs = new URLSearchParams();
    const t = next.tab ?? tab;
    if (t !== "popular") qs.set("tab", t);
    const c = next.channel === undefined ? channel : next.channel;
    const g = next.genre === undefined ? genre : next.genre;
    if (c) qs.set("channel", c);
    if (g) qs.set("genre", g);
    const s = qs.toString();
    return s ? `/requests?${s}` : "/requests";
  };

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={`container ${styles.heroInner}`}>
          <p className="eyebrow">Community requests</p>
          <h1 className={styles.heroTitle}>Can&rsquo;t find the ScenePack you&rsquo;re looking for?</h1>
          <p className="lead">Request it and let the FoundingVFX community show what they want next.</p>
          <div className={styles.heroActions}>
            <Button href="/requests/new" size="lg" icon={<MessageSquarePlus size={19} aria-hidden />}>
              Request a ScenePack
            </Button>
            <Button href="#board" size="lg" variant="secondary">
              Browse Requests
            </Button>
          </div>
        </div>
      </section>

      <section id="board" className={`container ${styles.board}`} aria-labelledby="board-title">
        <h2 id="board-title" className="visually-hidden">
          Request board
        </h2>
        <nav className={styles.tabs} aria-label="Request tabs">
          {TAB_ORDER.map((t) => (
            <Link key={t} href={href({ tab: t })} className={`${styles.tab} ${t === tab ? styles.tabActive : ""}`} aria-current={t === tab ? "page" : undefined} scroll={false}>
              {TAB_LABELS[t]}
            </Link>
          ))}
        </nav>

        <div className={styles.filters}>
          <span className={styles.filterLabel}>Channel</span>
          <ChipLink href={href({ channel: null })} active={!channel}>
            All
          </ChipLink>
          {channels.map((c) => (
            <ChipLink key={c.id} href={href({ channel: c.slug })} active={channel === c.slug}>
              {c.name}
            </ChipLink>
          ))}
        </div>
        <div className={styles.filters}>
          <span className={styles.filterLabel}>Genre</span>
          <ChipLink href={href({ genre: null })} active={!genre}>
            All
          </ChipLink>
          {genres.map((g) => (
            <ChipLink key={g.id} href={href({ genre: g.slug })} active={genre === g.slug}>
              {g.name}
            </ChipLink>
          ))}
        </div>

        {requests.length === 0 ? (
          <EmptyState
            icon={<Inbox size={26} aria-hidden />}
            title="No requests here yet."
            description="Try another tab or filter — or be the first to request something."
            action={
              <Button href="/requests/new" icon={<MessageSquarePlus size={18} aria-hidden />}>
                Request a ScenePack
              </Button>
            }
          />
        ) : (
          <div className={styles.list}>
            {requests.map((r, i) => (
              <RequestCard key={r.id} request={r} rank={tab === "popular" ? i + 1 : undefined} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
