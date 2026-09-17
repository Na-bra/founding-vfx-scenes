import { SiteChrome } from "@/components/layout/SiteChrome";

/**
 * Public pages are cached and regenerated at most once a minute, so scheduled
 * ScenePacks go live automatically shortly after their publish time.
 */
export const revalidate = 60;

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <SiteChrome>{children}</SiteChrome>;
}
