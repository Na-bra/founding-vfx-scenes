import "server-only";

import type { ContentRepository } from "./repository";
import { prismaRepository } from "./prisma/repository";
import { sampleRepository } from "./sample/repository";

/**
 * Returns the active content repository.
 *
 * DATA_SOURCE=sample   (default) in-memory demo content
 * DATA_SOURCE=database Supabase PostgreSQL via Prisma
 */
export function getRepository(): ContentRepository {
  const source = process.env.DATA_SOURCE ?? "sample";
  if (source === "database") return prismaRepository;
  if (source === "sample") return sampleRepository;
  throw new Error(`Unknown DATA_SOURCE "${source}". Use "sample" or "database".`);
}

export function isDemoContent(): boolean {
  return getRepository().source === "sample";
}
