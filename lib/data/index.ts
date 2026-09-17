import "server-only";

import type { ContentRepository } from "./repository";
import { sampleRepository } from "./sample/repository";

/**
 * Returns the active content repository.
 *
 * DATA_SOURCE=sample   (default) in-memory demo content
 * DATA_SOURCE=database PostgreSQL via Prisma — implemented in Phase 5
 */
export function getRepository(): ContentRepository {
  const source = process.env.DATA_SOURCE ?? "sample";
  if (source === "sample") return sampleRepository;
  throw new Error(
    `DATA_SOURCE="${source}" is not available yet. The database repository is part of Phase 5; use DATA_SOURCE=sample for now.`,
  );
}

export function isDemoContent(): boolean {
  return getRepository().source === "sample";
}
