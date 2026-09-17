import "server-only";

import type { ID } from "@/types/content";
import type { StorageObject } from "@/types/storage";
import { prismaStorageRepository } from "./prisma/storage";

/**
 * Server-only access to storage records. Kept separate from the content
 * repository so storage fields can never be accidentally joined into data
 * that is rendered or serialized to the browser.
 */
export interface StorageRepository {
  getForScenePack(scenePackId: ID): Promise<StorageObject | null>;
}

/**
 * Demo content has no files attached, so every lookup returns null and the
 * download flow reports "unavailable".
 */
const sampleStorageObjects: StorageObject[] = [];

export const storageRepository: StorageRepository = {
  async getForScenePack(scenePackId) {
    if (process.env.DATA_SOURCE === "database") return prismaStorageRepository.getForScenePack(scenePackId);
    return sampleStorageObjects.find((o) => o.scenePackId === scenePackId) ?? null;
  },
};
