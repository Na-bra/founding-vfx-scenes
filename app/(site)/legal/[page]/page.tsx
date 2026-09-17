import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { siteConfig } from "@/config/site";
import { PageHeader } from "@/components/ui/Primitives";
import { pageMetadata } from "@/lib/seo";
import styles from "./legal.module.css";

/**
 * Legal page scaffolds. The structure is ready; the wording must be written or
 * reviewed by a qualified professional before launch. Nothing here should be
 * read as a legal guarantee.
 */
const PAGES = {
  privacy: {
    title: "Privacy Policy",
    intro: "How FoundingVFX handles information when you use the site.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Browsing FoundingVFX does not require an account.",
          "Favorites are stored in your own browser on your device and are not sent to FoundingVFX.",
          "When you submit a report, we store the report reason and any details you provide.",
          "To prevent abuse, request rate limits use a one-way hash of your network address held briefly in server memory; raw IP addresses are not stored.",
        ],
      },
      { heading: "Cookies", body: ["A short-lived cookie remembers recent “Surprise me” results so you don't see repeats. Your theme preference is kept in local storage."] },
      { heading: "Third-party services", body: ["Downloads may be hosted by external storage providers, which have their own privacy policies. [Legal review required: list providers in use.]"] },
      { heading: "Your choices", body: ["[Legal review required: describe data access and deletion rights applicable to your jurisdiction.]"] },
    ],
  },
  terms: {
    title: "Terms of Use",
    intro: "The rules for using FoundingVFX.",
    sections: [
      { heading: "Using the site", body: ["[Legal review required: acceptable use, account terms and eligibility.]"] },
      { heading: "Content", body: ["ScenePacks are provided for editing purposes as described on each page. [Legal review required: licensing and permitted use.]"] },
      { heading: "Changes", body: ["[Legal review required: how changes to these terms are communicated.]"] },
    ],
  },
  "content-policy": {
    title: "Copyright & Content Policy",
    intro: "FoundingVFX only distributes content it has permission or legal authorization to distribute.",
    sections: [
      {
        heading: "Our commitment",
        body: [
          "We do not provide tools or content intended to bypass DRM, paywalls, copyright protection or access controls.",
          "All trademarks, show titles and characters belong to their respective owners.",
        ],
      },
      {
        heading: "Reporting a concern",
        body: ["If you believe content on FoundingVFX infringes your rights, contact us with details of the work and the page in question. [Legal review required: formal notice procedure and designated contact.]"],
      },
    ],
  },
} as const;

type Slug = keyof typeof PAGES;

export function generateStaticParams() {
  return Object.keys(PAGES).map((page) => ({ page }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/legal/[page]">): Promise<Metadata> {
  const page = PAGES[(await params).page as Slug];
  return page ? pageMetadata({ title: page.title, description: page.intro, path: `/legal/${(await params).page}` }) : {};
}

export default async function LegalPage({ params }: PageProps<"/legal/[page]">) {
  const slug = (await params).page as Slug;
  const page = PAGES[slug];
  if (!page) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title={page.title}
        description={page.intro}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: page.title }]}
      />
      <div className={`container ${styles.wrap}`}>
        <p className={styles.draft} role="note">
          <TriangleAlert size={18} aria-hidden />
          Draft — this page is awaiting legal review and is not yet a binding policy.
        </p>
        {page.sections.map((s) => (
          <section key={s.heading} className={styles.section}>
            <h2>{s.heading}</h2>
            {s.body.map((para) => (
              <p key={para}>{para}</p>
            ))}
          </section>
        ))}
        <p className={styles.contact}>
          Questions? Visit the <Link href="/contact">contact page</Link>
          {siteConfig.contactEmail && (
            <>
              {" "}
              or email <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>
            </>
          )}
          .
        </p>
      </div>
    </>
  );
}
