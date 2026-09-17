"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Eye, X } from "lucide-react";
import { Artwork } from "@/components/ui/Artwork";
import { Badge } from "@/components/ui/Primitives";
import { buttonClassName } from "@/components/ui/Button";
import { formatFileSize, formatSeasonEpisode } from "@/lib/format";
import { DownloadButton } from "./DownloadButton";
import type { ScenePackPreview } from "./types";
import styles from "./QuickView.module.css";

const QuickViewContext = createContext<((pack: ScenePackPreview) => void) | null>(null);

export function QuickViewProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pack, setPack] = useState<ScenePackPreview | null>(null);

  const open = useCallback((p: ScenePackPreview) => setPack(p), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (pack && dialog && !dialog.open) dialog.showModal();
  }, [pack]);

  const close = () => dialogRef.current?.close();
  const value = useMemo(() => open, [open]);

  return (
    <QuickViewContext.Provider value={value}>
      {children}
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="quick-view-title"
        onClose={() => setPack(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        {pack && (
          <div className={styles.panel}>
            <button type="button" className={styles.close} onClick={close} aria-label="Close quick view">
              <X size={18} aria-hidden />
            </button>
            <div className={styles.media}>
              <Artwork
                seed={pack.slug}
                image={pack.thumbnail}
                showLabel={false}
                sizes="(max-width: 720px) 100vw, 640px"
              />
            </div>
            <div className={styles.body}>
              <p className="eyebrow">
                <Link href={`/shows/${pack.show.slug}`} onClick={close}>
                  {pack.show.title}
                </Link>
              </p>
              <h2 id="quick-view-title" className={styles.title}>
                {pack.title}
              </h2>
              <div className={styles.badges}>
                <Badge tone="accent" mono>
                  {pack.technical.resolution}
                </Badge>
                <Badge mono>{pack.technical.fps} FPS</Badge>
                <Badge mono>{pack.technical.clipCount} clips</Badge>
                <Badge mono>{formatFileSize(pack.technical.fileSizeBytes)}</Badge>
                {formatSeasonEpisode(pack.season, pack.episode) && <Badge>{formatSeasonEpisode(pack.season, pack.episode)}</Badge>}
              </div>
              {pack.characters.length > 0 && (
                <p className={styles.characters}>
                  {pack.characters.map((c, i) => (
                    <span key={c.slug}>
                      {i > 0 && ", "}
                      <Link href={`/characters/${c.slug}`} onClick={close}>
                        {c.name}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
              <p className={styles.description}>{pack.description}</p>
              <div className={styles.actions}>
                <DownloadButton slug={pack.slug} />
                <Link href={`/scenepacks/${pack.slug}`} className={buttonClassName({ variant: "secondary", size: "lg" })} onClick={close}>
                  View full page <ArrowRight size={17} aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </QuickViewContext.Provider>
  );
}

export function QuickViewButton({ pack, className }: { pack: ScenePackPreview; className?: string }) {
  const open = useContext(QuickViewContext);
  if (!open) return null;
  return (
    <button
      type="button"
      className={[styles.trigger, className].filter(Boolean).join(" ")}
      onClick={() => open(pack)}
      aria-label={`Quick view: ${pack.title}`}
      title="Quick view"
    >
      <Eye size={17} aria-hidden />
    </button>
  );
}
