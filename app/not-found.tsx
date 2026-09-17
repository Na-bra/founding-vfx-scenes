import { Compass, House, Search } from "lucide-react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { StatusScreen } from "@/components/feedback/StatusScreen";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <SiteChrome>
      <StatusScreen
        code="404"
        icon={<Compass size={26} aria-hidden />}
        title="This page doesn't exist."
        description="The link may be broken, or the page may have been moved or unpublished."
        actions={
          <>
            <Button href="/" icon={<House size={18} aria-hidden />}>
              Return Home
            </Button>
            <Button href="/search" variant="secondary" icon={<Search size={18} aria-hidden />}>
              Search FoundingVFX
            </Button>
          </>
        }
      />
    </SiteChrome>
  );
}
