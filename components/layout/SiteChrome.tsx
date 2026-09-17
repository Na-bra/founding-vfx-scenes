import type { ReactNode } from "react";
import { getRepository } from "@/lib/data";
import { QuickViewProvider } from "@/components/scenepack/QuickView";
import { AnnouncementBar } from "./AnnouncementBar";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import { SocialLinks } from "./SocialLinks";

/** Public-site shell: announcements, navigation, main landmark and footer. */
export async function SiteChrome({ children }: { children: ReactNode }) {
  const repo = getRepository();
  const announcements = await repo.getActiveAnnouncements();

  return (
    <QuickViewProvider>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <AnnouncementBar announcements={announcements} demo={repo.source === "sample"} />
      <Navbar socialLinks={<SocialLinks variant="icons" />} />
      <main id="main" tabIndex={-1} style={{ outline: "none" }}>
        {children}
      </main>
      <Footer />
    </QuickViewProvider>
  );
}
