import { Mail } from "lucide-react";
import { siteConfig } from "@/config/site";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Primitives";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact",
  description: "Get in touch with FoundingVFX on Discord, TikTok, YouTube or by email.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Talk to FoundingVFX"
        description="The fastest way to reach us is the FoundingVFX community. For ScenePack ideas, use requests so others can vote on them."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
        actions={
          <>
            <Button href="/requests/new">Request a ScenePack</Button>
            {siteConfig.contactEmail && (
              <Button href={`mailto:${siteConfig.contactEmail}`} variant="secondary" icon={<Mail size={18} aria-hidden />}>
                {siteConfig.contactEmail}
              </Button>
            )}
          </>
        }
      />
      <div className="container">
        <SocialLinks variant="cards" />
      </div>
    </>
  );
}
