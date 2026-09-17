import "server-only";

import type { StorageObject, StorageProviderId } from "@/types/storage";
import type { ResolvedDownload, StorageProvider } from "../types";

/**
 * Link-based providers (share links from Google Drive, MEGA, TeraBox or any
 * HTTPS URL). No credentials are involved; the destination is whatever link
 * the admin configured, restricted to HTTPS on the provider's own hosts.
 */
function linkProvider(
  id: StorageProviderId,
  label: string,
  allowedHosts: string[] | null,
  fromObjectId?: (objectId: string) => string,
): StorageProvider {
  return {
    id,
    label,
    isConfigured: () => true,
    async resolveDownload(object: StorageObject): Promise<ResolvedDownload> {
      const raw = object.downloadUrl ?? (object.objectId && fromObjectId ? fromObjectId(object.objectId) : undefined);
      if (!raw) return { ok: false, reason: "not_configured" };

      let url: URL;
      try {
        url = new URL(raw);
      } catch {
        return { ok: false, reason: "provider_error", detail: "Invalid download URL" };
      }
      if (url.protocol !== "https:") return { ok: false, reason: "provider_error", detail: "Download URL must use HTTPS" };
      if (allowedHosts && !allowedHosts.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))) {
        return { ok: false, reason: "provider_error", detail: `Host ${url.hostname} does not belong to ${label}` };
      }
      return { ok: true, url: url.toString() };
    },
  };
}

export const externalUrlProvider = linkProvider("external_url", "External URL", null);

export const googleDriveProvider = linkProvider(
  "google_drive",
  "Google Drive",
  ["drive.google.com", "docs.google.com"],
  (fileId) => `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`,
);

export const megaProvider = linkProvider("mega", "MEGA", ["mega.nz", "mega.io"]);

export const teraboxProvider = linkProvider("terabox", "TeraBox", [
  "terabox.com",
  "1024terabox.com",
  "teraboxapp.com",
  "terabox.app",
]);
