import "server-only";

import { features } from "@/config/features";

/**
 * Aggregate, privacy-minimal event recording. No IPs, user agents or
 * personal identifiers are stored — only what's needed for counts.
 *
 * This is a no-op until analytics storage exists (Phase 10). All call sites
 * already go through here so enabling it requires no page changes.
 */
export type AnalyticsEvent =
  | { type: "scenepack_view"; scenePackId: string }
  | { type: "download_click"; scenePackId: string }
  | { type: "search"; query: string; resultCount: number };

export async function recordEvent(event: AnalyticsEvent): Promise<void> {
  if (!features.analytics) return;
  // Phase 10: persist to the `analytics_events` table in daily aggregate buckets.
  void event;
}
