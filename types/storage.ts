/**
 * Storage records are server-only. Never serialize these to the client.
 */

export type StorageProviderId =
  | "external_url"
  | "google_drive"
  | "mega"
  | "terabox"
  | "cloudflare_r2"
  | "backblaze_b2";

export type StorageHealth = "unknown" | "working" | "needs_attention";

export type StorageObject = {
  id: string;
  scenePackId: string;
  provider: StorageProviderId;
  /** Provider-specific identifier (file id, bucket key, …). */
  objectId?: string;
  /** Used by link-based providers (Drive/MEGA/TeraBox share links). */
  downloadUrl?: string;
  fileSizeBytes?: number;
  fileType?: string;
  /** Hex digest when available, used for duplicate detection. */
  checksum?: string;
  health: StorageHealth;
  lastCheckedAt?: string;
  lastError?: string;
};
