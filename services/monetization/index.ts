import "server-only";

import { getMonetizationSettings } from "@/config/monetization";

/**
 * Hook point between "resolved destination" and "visitor is sent there".
 *
 * Today every download is direct. When a provider such as Linkvertise is
 * integrated, implement a `MonetizationAdapter` following that provider's
 * current publisher rules and register it below. The flow must stay honest:
 * a clearly labeled step, a visible Continue action, and no fake buttons.
 */
export interface MonetizationAdapter {
  id: string;
  wrap(destination: string, context: { scenePackSlug: string }): Promise<string>;
}

const adapters: Record<string, MonetizationAdapter> = {};

export async function applyDownloadMonetization(destination: string, scenePackSlug: string): Promise<string> {
  const settings = getMonetizationSettings();
  if (settings.downloadMode !== "monetized") return destination;

  const adapter = settings.linkvertise.enabled ? adapters.linkvertise : undefined;
  // A mode without an implemented adapter falls back to direct rather than breaking downloads.
  return adapter ? adapter.wrap(destination, { scenePackSlug }) : destination;
}
