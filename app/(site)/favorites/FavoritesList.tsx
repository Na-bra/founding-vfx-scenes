"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import type { ScenePackView } from "@/types/content";
import { useFavorites } from "@/lib/client/favorites";
import { Artwork } from "@/components/ui/Artwork";
import { Button } from "@/components/ui/Button";
import { Badge, CardGridSkeleton, EmptyState } from "@/components/ui/Primitives";
import { formatFileSize } from "@/lib/format";
import styles from "./favorites.module.css";

export function FavoritesList() {
  const { ids, toggle, clear } = useFavorites();
  const [packs, setPacks] = useState<ScenePackView[] | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    fetch(`/api/scenepacks?ids=${encodeURIComponent(key)}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items: ScenePackView[] }) => setPacks(d.items))
      .catch(() => {});
    return () => controller.abort();
  }, [key]);

  if (ids.length === 0) {
    return (
      <EmptyState
        icon={<Heart size={26} aria-hidden />}
        title="No favorites yet."
        description="Tap Favorite on any ScenePack to keep it here."
        action={<Button href="/scenepacks">Browse ScenePacks</Button>}
      />
    );
  }

  if (!packs) return <CardGridSkeleton count={Math.min(ids.length, 8)} />;

  // Keep the order the visitor saved them in; drop packs that are no longer published.
  const byId = new Map(packs.map((p) => [p.id, p]));
  const ordered = ids.map((id) => byId.get(id)).filter((p): p is ScenePackView => Boolean(p));

  return (
    <>
      <div className={styles.toolbar}>
        <p>{ordered.length === 1 ? "1 ScenePack" : `${ordered.length} ScenePacks`}</p>
        <Button variant="ghost" size="sm" icon={<Trash2 size={15} aria-hidden />} onClick={clear}>
          Clear all
        </Button>
      </div>
      <ul className={styles.list}>
        {ordered.map((p) => (
          <li key={p.id} className={styles.item}>
            <Link href={`/scenepacks/${p.slug}`} className={styles.thumb} tabIndex={-1} aria-hidden>
              <Artwork seed={p.slug} image={p.thumbnail} showLabel={false} sizes="160px" />
            </Link>
            <div className={styles.text}>
              <Link href={`/scenepacks/${p.slug}`} className={styles.title}>
                {p.title}
              </Link>
              <p className={styles.sub}>
                {p.show.title} · {p.channel.name}
              </p>
              <div className={styles.badges}>
                <Badge mono>{p.technical.resolution}</Badge>
                <Badge mono>{p.technical.fps} FPS</Badge>
                <Badge mono>{formatFileSize(p.technical.fileSizeBytes)}</Badge>
              </div>
            </div>
            <button type="button" className={styles.remove} onClick={() => toggle(p.id)} aria-label={`Remove ${p.title} from favorites`}>
              <Heart size={18} fill="currentColor" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
