import Image from "next/image";
import type { ImageAsset } from "@/types/content";
import { hashString } from "@/lib/format";
import styles from "./Artwork.module.css";

/**
 * Artwork with a cinematic generated fallback.
 *
 * When an admin uploads real artwork it's rendered with next/image. Until
 * then, a deterministic duotone "poster" is generated from the record's seed
 * so every card still looks intentional — never a gray box.
 */

const PALETTES: [string, string, string][] = [
  ["#ff4d2e", "#2b0f3a", "#ffb547"],
  ["#3d7bff", "#0b1030", "#7cf3ff"],
  ["#c13cff", "#170826", "#ff6ab8"],
  ["#00c2a8", "#04221f", "#d7ff6a"],
  ["#ff2e63", "#1d0612", "#ff9a3d"],
  ["#f5b400", "#231500", "#ff5a36"],
  ["#5b5bff", "#0d0a24", "#ff5ad1"],
  ["#12b0ff", "#021826", "#62ffb0"],
];

type Props = {
  seed: string;
  label?: string;
  sublabel?: string;
  image?: ImageAsset;
  variant?: "landscape" | "poster" | "banner" | "square";
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Show the generated title typography (off for small thumbnails). */
  showLabel?: boolean;
};

export function Artwork({
  seed,
  label,
  sublabel,
  image,
  variant = "landscape",
  sizes = "(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 25vw",
  priority,
  className,
  showLabel = true,
}: Props) {
  const cls = [styles.artwork, styles[variant], className].filter(Boolean).join(" ");

  if (image) {
    return (
      <div className={cls}>
        <Image src={image.src} alt={image.alt} fill sizes={sizes} priority={priority} className={styles.image} />
      </div>
    );
  }

  const h = hashString(seed);
  const [a, b, c] = PALETTES[h % PALETTES.length];
  const angle = (h >> 3) % 360;
  const x = 20 + ((h >> 7) % 60);
  const y = 15 + ((h >> 11) % 50);
  // Shrink the generated title so its longest word fits on one line.
  const longestWord = Math.max(1, ...(label ?? "").split(/\s+/).map((w) => w.length));
  const fit = Math.min(1, (variant === "poster" ? 9.5 : 13) / longestWord);

  return (
    <div
      className={`${cls} ${styles.generated}`}
      role="img"
      aria-label={label ? `${label} artwork` : "Artwork"}
      style={
        {
          "--c1": a,
          "--c2": b,
          "--c3": c,
          "--angle": `${angle}deg`,
          "--x": `${x}%`,
          "--y": `${y}%`,
          "--fit": fit.toFixed(3),
        } as React.CSSProperties
      }
    >
      <span className={styles.leak} aria-hidden />
      <span className={styles.bars} aria-hidden />
      <span className={styles.grain} aria-hidden />
      {showLabel && label && (
        <span className={styles.label} aria-hidden>
          {sublabel && <span className={styles.sublabel}>{sublabel}</span>}
          <span className={styles.title}>{label}</span>
        </span>
      )}
    </div>
  );
}
