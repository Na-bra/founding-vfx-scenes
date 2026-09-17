import "server-only";

import { getDb } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { AdminUser } from "./auth";

/** Field names whose values are never written to the audit log. */
const REDACTED = new Set(["downloadUrl", "objectId", "checksum", "password"]);

/**
 * Records an admin action. Stores which fields changed; values are kept only
 * for short, non-sensitive fields so the log stays useful without leaking
 * storage links.
 */
export async function audit(
  actor: AdminUser,
  action: string,
  target: { type: string; id: string; label?: string },
  changes?: Record<string, { from?: unknown; to?: unknown }>,
) {
  const safe: Record<string, unknown> = {};
  for (const [field, diff] of Object.entries(changes ?? {})) {
    const short = (v: unknown) => (typeof v === "string" && v.length > 120 ? `${v.slice(0, 117)}…` : v);
    safe[field] = REDACTED.has(field) ? "changed" : { from: short(diff.from), to: short(diff.to) };
  }
  await getDb().auditLog.create({
    data: {
      actorId: actor.id,
      action,
      targetType: target.type,
      targetId: target.id,
      changes: { label: target.label ?? null, fields: safe } as Prisma.InputJsonValue,
    },
  });
}

/** Compares two flat records and returns the fields that differ. */
export function diff<T extends Record<string, unknown>>(before: T, after: Partial<T>) {
  const out: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(after)) {
    const a = before[key];
    const b = after[key];
    const norm = (v: unknown) => (v instanceof Date ? v.toISOString() : typeof v === "bigint" ? v.toString() : JSON.stringify(v));
    if (norm(a) !== norm(b)) out[key] = { from: a instanceof Date ? a.toISOString() : typeof a === "bigint" ? a.toString() : a, to: b instanceof Date ? b.toISOString() : typeof b === "bigint" ? b.toString() : b };
  }
  return out;
}
