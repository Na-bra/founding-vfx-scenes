/**
 * Central, non-secret site configuration.
 *
 * Anything here may reach the browser. Secrets belong in server-only env vars
 * read inside `services/` — never in this file.
 *
 * Social URLs are configurable via env so they can be changed without code
 * edits. Once an admin settings table exists, these become defaults that the
 * database can override.
 */

function optionalUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export type SocialLink = {
  id: "youtube" | "tiktok" | "discord";
  label: string;
  handle: string;
  /** `null` when not yet configured — UI renders a disabled state. */
  href: string | null;
};

export const siteConfig = {
  name: "FoundingVFX",
  tagline: "Discover, explore and download high-quality ScenePacks for your next edit.",
  description:
    "FoundingVFX is a creator-focused home for discovering, organizing and downloading authorized ScenePacks for your edits.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || null,
  social: [
    {
      id: "youtube",
      label: "YouTube",
      handle: "FoundingVFX",
      href: optionalUrl(process.env.NEXT_PUBLIC_YOUTUBE_URL),
    },
    {
      id: "tiktok",
      label: "TikTok",
      handle: "@foundingvfx8",
      href: optionalUrl(process.env.NEXT_PUBLIC_TIKTOK_URL),
    },
    {
      id: "discord",
      label: "Discord",
      handle: "foundvfx",
      href: optionalUrl(process.env.NEXT_PUBLIC_DISCORD_INVITE_URL),
    },
  ] satisfies SocialLink[],
} as const;

export const mainNav = [
  { href: "/", label: "Home" },
  { href: "/scenepacks", label: "ScenePacks" },
  { href: "/shows", label: "Shows" },
  { href: "/genres", label: "Genres" },
  { href: "/channels", label: "Channels" },
  { href: "/playlists", label: "Playlists" },
  { href: "/requests", label: "Requests" },
] as const;

export const legalNav = [
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/content-policy", label: "Copyright & Content Policy" },
  { href: "/contact", label: "Contact" },
] as const;
