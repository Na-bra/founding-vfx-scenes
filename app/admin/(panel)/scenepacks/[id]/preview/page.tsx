import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { loadScenePackPreview } from "@/lib/data/prisma/preview";
import { QuickViewProvider } from "@/components/scenepack/QuickView";
import { ScenePackDetail } from "@/components/scenepack/ScenePackDetail";
import { LinkButton, adminStyles as styles } from "@/components/admin/ui";

export const metadata = { title: "Preview" };

export default async function PreviewPage({ params }: PageProps<"/admin/scenepacks/[id]/preview">) {
  await requireAdmin("scenepacks.write");
  const { id } = await params;
  const pack = await loadScenePackPreview(id);
  if (!pack) notFound();

  return (
    <>
      <div className={styles.notice} style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <Eye size={18} aria-hidden /> Preview — this is how the page will look once it&rsquo;s live.
        </span>
        <LinkButton href={`/admin/scenepacks/${id}`} tone="secondary">
          <ArrowLeft size={15} aria-hidden /> Back to editor
        </LinkButton>
      </div>
      <div style={{ marginInline: "calc(clamp(12px, 3vw, 28px) * -1)", overflow: "hidden", borderRadius: 16 }}>
        <QuickViewProvider>
          <ScenePackDetail pack={pack} similar={[]} preview={<p className={styles.hint}>Download and sharing are disabled in preview.</p>} />
        </QuickViewProvider>
      </div>
    </>
  );
}
