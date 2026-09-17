import type { StorageObject, StorageProviderId } from "@/types/storage";

export type ResolvedDownload =
  | { ok: true; url: string; expiresAt?: string }
  | { ok: false; reason: "not_configured" | "unavailable" | "provider_error"; detail?: string };

/**
 * Every storage backend implements this interface. The download service only
 * talks to providers through it, so switching a ScenePack from Google Drive to
 * Cloudflare R2 is a data change, not a code change.
 */
export interface StorageProvider {
  readonly id: StorageProviderId;
  readonly label: string;
  /** Whether server credentials/config required by this provider are present. */
  isConfigured(): boolean;
  resolveDownload(object: StorageObject): Promise<ResolvedDownload>;
}
