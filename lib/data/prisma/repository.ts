import "server-only";

import type { ContentRepository } from "@/lib/data/repository";
import { buildMemoryRepository, type Dataset, type RepositoryHooks } from "@/lib/data/memory/repository";
import { getDb } from "@/lib/db";
import { loadDataset } from "./dataset";

/**
 * Database-backed ContentRepository.
 *
 * Reads a snapshot of published content from Supabase and serves queries from
 * it, refreshing at most every SNAPSHOT_TTL_MS. Concurrent requests share one
 * in-flight load, and a failed refresh keeps serving the last good snapshot.
 *
 * This keeps every query consistent with the tested in-memory logic and is
 * efficient up to thousands of ScenePacks. Beyond that, move search and
 * filtering into SQL behind the same interface.
 */
const SNAPSHOT_TTL_MS = Number(process.env.CONTENT_SNAPSHOT_TTL_MS ?? 30_000);

const hooks: RepositoryHooks = {
  source: "database",
  async createReport(report) {
    const created = await getDb().report.create({
      data: { scenePackId: report.scenePackId, reason: report.reason, details: report.details },
      select: { id: true },
    });
    return created;
  },
};

type Snapshot = { repo: ContentRepository; loadedAt: number };

let current: Snapshot | null = null;
let inflight: Promise<Snapshot> | null = null;

async function loadWithRetry(): Promise<Dataset> {
  try {
    return await loadDataset();
  } catch (error) {
    // Pooled connections occasionally drop; one quick retry covers transient failures.
    console.warn("[db] content load failed, retrying once", error);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return loadDataset();
  }
}

async function refresh(): Promise<Snapshot> {
  const dataset: Dataset = await loadWithRetry();
  current = { repo: buildMemoryRepository(dataset, hooks), loadedAt: Date.now() };
  return current;
}

async function snapshot(): Promise<ContentRepository> {
  if (current && Date.now() - current.loadedAt < SNAPSHOT_TTL_MS) return current.repo;
  inflight ??= refresh().finally(() => {
    inflight = null;
  });
  try {
    return (await inflight).repo;
  } catch (error) {
    if (current) {
      console.error("[db] content refresh failed; serving previous snapshot", error);
      return current.repo;
    }
    throw error;
  }
}

/** Forces the next read to reload from the database (call after admin writes). */
export function invalidateContentSnapshot() {
  current = null;
}

type Method = Exclude<keyof ContentRepository, "source" | "createReport">;

const METHODS = [
  "listScenePacks",
  "getScenePack",
  "getScenePacksByIds",
  "getFeaturedScenePacks",
  "getRecentScenePacks",
  "getSimilarScenePacks",
  "getRandomScenePack",
  "getScenePackFacets",
  "listShows",
  "getShow",
  "listCharacters",
  "getCharacter",
  "listChannels",
  "getChannel",
  "listGenres",
  "getGenre",
  "listPlaylists",
  "getPlaylist",
  "listCollections",
  "getCollection",
  "getTag",
  "listRequests",
  "getRequest",
  "search",
  "suggest",
  "getActiveAnnouncements",
  "getChangelog",
  "getSiteCounts",
] as const satisfies readonly Method[];

// Compile-time guard: adding a repository method without delegating it fails the build.
type Undelegated = Exclude<Method, (typeof METHODS)[number]>;
const allMethodsDelegated: [Undelegated] extends [never] ? true : Undelegated = true;
void allMethodsDelegated;

const delegated = Object.fromEntries(
  METHODS.map((name) => [
    name,
    async (...args: unknown[]) => {
      const repo = await snapshot();
      // Keep `this` bound: some methods (search, suggest) call sibling methods.
      return (repo[name] as (...a: unknown[]) => unknown).apply(repo, args);
    },
  ]),
) as unknown as Pick<ContentRepository, Method>;

export const prismaRepository: ContentRepository = {
  source: "database",
  ...delegated,
  createReport: hooks.createReport,
};
