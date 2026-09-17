import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Flame, ThumbsUp } from "lucide-react";
import type { RequestStatus } from "@/types/content";
import { getRepository } from "@/lib/data";
import { REQUEST_STATUS, StatusBadge } from "@/components/requests/RequestCard";
import { Button } from "@/components/ui/Button";
import { Badge, Breadcrumbs, MetaGrid } from "@/components/ui/Primitives";
import { formatDate } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import styles from "./request.module.css";

const TIMELINE: RequestStatus[] = ["pending", "under_review", "planned", "in_progress", "completed", "published"];

export async function generateMetadata({ params }: PageProps<"/requests/[id]">): Promise<Metadata> {
  const request = await getRepository().getRequest((await params).id);
  if (!request) return { title: "Request not found" };
  return pageMetadata({
    title: `Request: ${request.title}`,
    description: `${request.voteCount} people want a ${request.title} ScenePack. ${request.description}`,
    path: `/requests/${request.id}`,
  });
}

export default async function RequestPage({ params }: PageProps<"/requests/[id]">) {
  const request = await getRepository().getRequest((await params).id);
  if (!request) notFound();

  const stage = TIMELINE.indexOf(request.status);
  const meta = [
    { label: "Show / Movie", value: request.show ? <Link href={`/shows/${request.show.slug}`}>{request.showTitle}</Link> : request.showTitle },
    ...(request.characterName ? [{ label: "Character", value: request.characterName }] : []),
    ...(request.channel ? [{ label: "Channel", value: <Link href={`/channels/${request.channel.slug}`}>{request.channel.name}</Link> }] : []),
    ...(request.genre ? [{ label: "Genre", value: <Link href={`/genres/${request.genre.slug}`}>{request.genre.name}</Link> }] : []),
    ...(request.year ? [{ label: "Year", value: request.year }] : []),
    ...(request.season !== undefined ? [{ label: "Season", value: request.season }] : []),
    ...(request.episode !== undefined ? [{ label: "Episode", value: request.episode }] : []),
    ...(request.preferredResolution ? [{ label: "Preferred resolution", value: request.preferredResolution }] : []),
    ...(request.preferredFps ? [{ label: "Preferred FPS", value: request.preferredFps }] : []),
  ];

  return (
    <div className={`container ${styles.page}`}>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Requests", href: "/requests" }, { label: request.title }]} />

      <div className={styles.grid}>
        <div className={styles.main}>
          <div className={styles.badges}>
            <StatusBadge status={request.status} />
            {request.highPriority && (
              <Badge tone="accent" icon={<Flame aria-hidden />}>
                High priority
              </Badge>
            )}
          </div>
          <h1 className={styles.title}>{request.title}</h1>
          <p className={styles.description}>{request.description}</p>

          {request.fulfilledBy && (
            <Link href={`/scenepacks/${request.fulfilledBy.slug}`} className={styles.fulfilled}>
              <CheckCircle2 size={22} aria-hidden />
              <span>
                <strong>🎬 This request is now available.</strong>
                <span>{request.fulfilledBy.title}</span>
              </span>
              <ArrowRight size={18} aria-hidden />
            </Link>
          )}

          <MetaGrid items={meta} />

          {request.status !== "declined" && (
            <section aria-labelledby="timeline-heading">
              <h2 id="timeline-heading" className={styles.h2}>
                Progress
              </h2>
              <ol className={styles.timeline}>
                {TIMELINE.map((s, i) => (
                  <li key={s} className={i <= stage ? styles.done : undefined} aria-current={i === stage ? "step" : undefined}>
                    <span className={styles.node} aria-hidden />
                    {REQUEST_STATUS[s].label}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <aside className={styles.side}>
          <div className={styles.voteCard}>
            <ThumbsUp size={22} aria-hidden className={styles.voteIcon} />
            <p className={styles.voteCount}>{request.voteCount.toLocaleString("en-US")}</p>
            <p className={styles.voteLabel}>{request.voteCount === 1 ? "person wants this" : "people want this"}</p>
            <Button block disabled aria-describedby="vote-note">
              Vote
            </Button>
            <p id="vote-note" className={styles.voteNote}>
              Voting opens in an upcoming update.
            </p>
          </div>
          <dl className={styles.dates}>
            <div>
              <dt>Requested</dt>
              <dd>{formatDate(request.createdAt)}</dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>{formatDate(request.updatedAt)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
