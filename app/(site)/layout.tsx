import { SiteChrome } from "@/components/layout/SiteChrome";

/**
 * Rendered per request from the in-memory content snapshot (refreshed from the
 * database every 30s). This keeps builds free of database access, makes
 * scheduled ScenePacks go live on time, and shows admin edits within seconds.
 */
export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <SiteChrome>{children}</SiteChrome>;
}
