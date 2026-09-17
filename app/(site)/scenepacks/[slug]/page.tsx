import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRepository } from "@/lib/data";
import { ScenePackDetail } from "@/components/scenepack/ScenePackDetail";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/scenepacks/[slug]">): Promise<Metadata> {
  const pack = await getRepository().getScenePack((await params).slug);
  if (!pack) return { title: "ScenePack not found" };
  return pageMetadata({
    title: `${pack.title} ScenePack`,
    description: `${pack.show.title} ScenePack · ${pack.technical.resolution} ${pack.technical.fps}FPS · ${pack.technical.clipCount} clips. ${pack.description}`,
    path: `/scenepacks/${pack.slug}`,
  });
}

export default async function ScenePackPage({ params }: PageProps<"/scenepacks/[slug]">) {
  const { slug } = await params;
  const repo = getRepository();
  const pack = await repo.getScenePack(slug);
  if (!pack) notFound();
  const similar = await repo.getSimilarScenePacks(pack.id, 4);
  return <ScenePackDetail pack={pack} similar={similar} />;
}
