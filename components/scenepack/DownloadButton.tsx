import Link from "next/link";
import { Download } from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";

/**
 * Always routes through /download/[slug] so the server resolves the real
 * destination (storage provider + future monetization step). Prefetch is off
 * so hovering never triggers a resolution or counts a download.
 */
export function DownloadButton({ slug, label = "Download ScenePack", block }: { slug: string; label?: string; block?: boolean }) {
  return (
    <Link href={`/download/${slug}`} prefetch={false} rel="nofollow" className={buttonClassName({ variant: "primary", size: "lg", block })}>
      <Download size={19} aria-hidden />
      <span>{label}</span>
    </Link>
  );
}
