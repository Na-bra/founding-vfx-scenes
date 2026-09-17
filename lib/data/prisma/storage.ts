import "server-only";

import type { StorageRepository } from "@/lib/data/storage";
import { getDb } from "@/lib/db";

/** Current storage record for a ScenePack, read fresh on every download. */
export const prismaStorageRepository: StorageRepository = {
  async getForScenePack(scenePackId) {
    const o = await getDb().storageObject.findFirst({
      where: { scenePackId, isCurrent: true },
      orderBy: { createdAt: "desc" },
    });
    if (!o) return null;
    return {
      id: o.id,
      scenePackId: o.scenePackId,
      provider: o.provider,
      objectId: o.objectId ?? undefined,
      downloadUrl: o.downloadUrl ?? undefined,
      fileSizeBytes: o.fileSizeBytes === null ? undefined : Number(o.fileSizeBytes),
      fileType: o.fileType ?? undefined,
      checksum: o.checksum ?? undefined,
      health: o.health,
      lastCheckedAt: o.lastCheckedAt?.toISOString(),
      lastError: o.lastError ?? undefined,
    };
  },
};
