import "server-only";

import type { ScenePackView } from "@/types/content";
import { buildMemoryRepository } from "@/lib/data/memory/repository";
import { loadDataset } from "./dataset";

/** Renders any ScenePack (draft, scheduled, unpublished) as it would look once live. Admin only. */
export async function loadScenePackPreview(id: string): Promise<ScenePackView | null> {
  const ds = await loadDataset({ previewScenePackId: id });
  const target = ds.scenePacks.find((p) => p.id === id);
  if (!target) return null;
  const live = { ...target, status: "published" as const, publishedAt: target.publishedAt && Date.parse(target.publishedAt) <= Date.now() ? target.publishedAt : new Date(0).toISOString() };
  const repo = buildMemoryRepository(
    { ...ds, scenePacks: ds.scenePacks.map((p) => (p.id === id ? live : p)) },
    { source: "database", createReport: async () => ({ id: "" }) },
  );
  const view = await repo.getScenePack(target.slug);
  return view && { ...view, publishedAt: target.publishedAt };
}
