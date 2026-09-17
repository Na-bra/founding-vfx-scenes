import "server-only";

import type { StorageProviderId } from "@/types/storage";
import { externalUrlProvider, googleDriveProvider, megaProvider, teraboxProvider } from "./providers/link";
import { backblazeB2Provider, cloudflareR2Provider } from "./providers/s3-compatible";
import type { StorageProvider } from "./types";

const providers: Record<StorageProviderId, StorageProvider> = {
  external_url: externalUrlProvider,
  google_drive: googleDriveProvider,
  mega: megaProvider,
  terabox: teraboxProvider,
  cloudflare_r2: cloudflareR2Provider,
  backblaze_b2: backblazeB2Provider,
};

export function getStorageProvider(id: StorageProviderId): StorageProvider {
  return providers[id];
}

export function listStorageProviders(): StorageProvider[] {
  return Object.values(providers);
}

export type { ResolvedDownload, StorageProvider } from "./types";
