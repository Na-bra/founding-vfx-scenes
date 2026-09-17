import "server-only";

import type { StorageObject, StorageProviderId } from "@/types/storage";
import { presignGetObject } from "../sigv4";
import type { ResolvedDownload, StorageProvider } from "../types";

type S3Env = {
  endpoint?: string;
  region: string;
  bucket?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
};

const EXPIRES_IN_SECONDS = 60 * 15;

function s3CompatibleProvider(id: StorageProviderId, label: string, readEnv: () => S3Env): StorageProvider {
  const configured = (env: S3Env) => Boolean(env.endpoint && env.bucket && env.accessKeyId && env.secretAccessKey);

  return {
    id,
    label,
    isConfigured: () => configured(readEnv()),
    async resolveDownload(object: StorageObject): Promise<ResolvedDownload> {
      const env = readEnv();
      if (!configured(env)) return { ok: false, reason: "not_configured", detail: `${label} credentials are not set` };
      if (!object.objectId) return { ok: false, reason: "not_configured", detail: "Missing object key" };

      const filename = object.objectId.split("/").pop() ?? "scenepack";
      const now = new Date();
      try {
        const url = presignGetObject({
          endpoint: env.endpoint!,
          region: env.region,
          bucket: env.bucket!,
          key: object.objectId,
          accessKeyId: env.accessKeyId!,
          secretAccessKey: env.secretAccessKey!,
          expiresInSeconds: EXPIRES_IN_SECONDS,
          now,
          responseContentDisposition: `attachment; filename="${filename.replace(/["\\]/g, "")}"`,
        });
        return { ok: true, url, expiresAt: new Date(now.getTime() + EXPIRES_IN_SECONDS * 1000).toISOString() };
      } catch (error) {
        return { ok: false, reason: "provider_error", detail: error instanceof Error ? error.message : "Signing failed" };
      }
    },
  };
}

export const cloudflareR2Provider = s3CompatibleProvider("cloudflare_r2", "Cloudflare R2", () => ({
  endpoint: process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined,
  region: "auto",
  bucket: process.env.R2_BUCKET,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
}));

export const backblazeB2Provider = s3CompatibleProvider("backblaze_b2", "Backblaze B2", () => ({
  endpoint: process.env.B2_ENDPOINT,
  region: process.env.B2_REGION ?? "us-west-004",
  bucket: process.env.B2_BUCKET,
  accessKeyId: process.env.B2_KEY_ID,
  secretAccessKey: process.env.B2_APPLICATION_KEY,
}));
