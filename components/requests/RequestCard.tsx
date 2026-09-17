import Link from "next/link";
import { ArrowRight, Flame, ThumbsUp } from "lucide-react";
import type { RequestStatus } from "@/types/content";
import type { RequestView } from "@/lib/data/repository";
import { Badge, type BadgeTone } from "@/components/ui/Primitives";
import { formatDate } from "@/lib/format";
import styles from "./RequestCard.module.css";

export const REQUEST_STATUS: Record<RequestStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Pending", tone: "neutral" },
  under_review: { label: "Under review", tone: "info" },
  planned: { label: "Planned", tone: "warning" },
  in_progress: { label: "In progress", tone: "accent" },
  completed: { label: "Completed", tone: "success" },
  published: { label: "Published", tone: "success" },
  declined: { label: "Declined", tone: "danger" },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const s = REQUEST_STATUS[status];
  return (
    <Badge tone={s.tone}>
      <span className={styles.dot} aria-hidden />
      {s.label}
    </Badge>
  );
}

export function RequestCard({ request, rank }: { request: RequestView; rank?: number }) {
  return (
    <article className={styles.card} data-status={request.status}>
      <div className={styles.votes} aria-label={`${request.voteCount} votes`}>
        <ThumbsUp size={16} aria-hidden />
        <span className={styles.voteCount}>{request.voteCount.toLocaleString("en-US")}</span>
        <span className={styles.voteLabel}>votes</span>
      </div>

      <div className={styles.body}>
        <div className={styles.top}>
          <StatusBadge status={request.status} />
          {request.highPriority && (
            <Badge tone="accent" icon={<Flame aria-hidden />}>
              High priority
            </Badge>
          )}
          {rank !== undefined && <span className={styles.rank}>#{rank}</span>}
        </div>
        <h3 className={styles.title}>
          <Link href={`/requests/${request.id}`} className={styles.titleLink}>
            {request.title}
          </Link>
        </h3>
        <p className={styles.meta}>
          {request.show ? <Link href={`/shows/${request.show.slug}`}>{request.showTitle}</Link> : <span>{request.showTitle}</span>}
          {request.characterName && <span>{request.characterName}</span>}
          {request.year && <span>{request.year}</span>}
          {request.genre && <span>{request.genre.name}</span>}
        </p>
        <p className={styles.description}>{request.description}</p>
        <div className={styles.footer}>
          <span className={styles.date}>Requested {formatDate(request.createdAt)}</span>
          {request.fulfilledBy ? (
            <Link href={`/scenepacks/${request.fulfilledBy.slug}`} className={styles.fulfilled}>
              Get the ScenePack <ArrowRight size={14} aria-hidden />
            </Link>
          ) : (
            <Link href={`/requests/${request.id}`} className={styles.view}>
              View request <ArrowRight size={14} aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
