import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

/** Consistent per-page metadata: title, description, canonical URL and Open Graph/Twitter cards. */
export function pageMetadata({
  title,
  description,
  path,
  noIndex,
}: {
  title: string;
  description?: string;
  path: string;
  noIndex?: boolean;
}): Metadata {
  const desc = description ?? siteConfig.description;
  return {
    title,
    description: desc,
    alternates: { canonical: path },
    openGraph: { title: `${title} · ${siteConfig.name}`, description: desc, url: path, siteName: siteConfig.name, type: "website" },
    twitter: { card: "summary_large_image", title: `${title} · ${siteConfig.name}`, description: desc },
    robots: noIndex ? { index: false, follow: true } : undefined,
  };
}
