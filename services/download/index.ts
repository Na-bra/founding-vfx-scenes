import "server-only";

import { getRepository } from "@/lib/data";
import { storageRepository } from "@/lib/data/storage";
import { recordEvent } from "@/services/analytics";
import { applyDownloadMonetization } from "@/services/monetization";
import { getStorageProvider } from "@/services/storage";

export type DownloadResolution =
  | { status: "redirect"; url: string }
  | { status: "not_found" }
  | { status: "unavailable"; title: string; slug: string };

/**
 * User → ScenePack → Download button → **this service** → destination.
 *
 * Failures never throw to the page; they resolve to "unavailable" and are
 * logged server-side for the admin storage-health view.
 */
export async function resolveScenePackDownload(slug: string): Promise<DownloadResolution> {
  const pack = await getRepository().getScenePack(slug);
  if (!pack) return { status: "not_found" };

  const unavailable = { status: "unavailable", title: pack.title, slug: pack.slug } as const;

  try {
    const object = await storageRepository.getForScenePack(pack.id);
    if (!object) return unavailable;

    const resolved = await getStorageProvider(object.provider).resolveDownload(object);
    if (!resolved.ok) {
      console.warn(`[download] ${pack.slug}: ${resolved.reason}${resolved.detail ? ` — ${resolved.detail}` : ""}`);
      return unavailable;
    }

    await recordEvent({ type: "download_click", scenePackId: pack.id });
    return { status: "redirect", url: await applyDownloadMonetization(resolved.url, pack.slug) };
  } catch (error) {
    console.error(`[download] ${pack.slug}: unexpected error`, error);
    return unavailable;
  }
}
