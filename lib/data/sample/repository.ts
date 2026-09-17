import "server-only";

import type { ID } from "@/types/content";
import { buildMemoryRepository } from "@/lib/data/memory/repository";
import { characters, channels, genres, shows, tags } from "./taxonomy";
import { scenePacks } from "./scenepacks";
import { announcements, changelog, collections, playlists, requests } from "./community";

const reports: { id: ID; scenePackId: ID; reason: string; details?: string; createdAt: string }[] = [];

/** Demo repository backed by the in-repo sample dataset. */
export const sampleRepository = buildMemoryRepository(
  { channels, genres, tags, shows, characters, scenePacks, playlists, collections, requests, announcements, changelog },
  {
    source: "sample",
    async createReport(report) {
      const id = `rp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      reports.push({ id, ...report, createdAt: new Date().toISOString() });
      if (reports.length > 500) reports.shift();
      return { id };
    },
  },
);
