import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CloudOff, RotateCw } from "lucide-react";
import { resolveScenePackDownload } from "@/services/download";
import { StatusScreen } from "@/components/feedback/StatusScreen";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Download", robots: { index: false, follow: false } };

export default async function DownloadPage({ params }: PageProps<"/download/[slug]">) {
  const { slug } = await params;
  const result = await resolveScenePackDownload(slug);

  if (result.status === "not_found") notFound();
  if (result.status === "redirect") redirect(result.url);

  return (
    <StatusScreen
      icon={<CloudOff size={26} aria-hidden />}
      title="This download is currently unavailable."
      description={`We couldn't reach the files for “${result.title}” right now. Please try again later.`}
      actions={
        <>
          <Button href={`/download/${result.slug}`} prefetch={false} icon={<RotateCw size={18} aria-hidden />}>
            Try Again
          </Button>
          <Button href={`/scenepacks/${result.slug}`} variant="secondary" icon={<ArrowLeft size={18} aria-hidden />}>
            Back to ScenePack
          </Button>
        </>
      }
    />
  );
}
