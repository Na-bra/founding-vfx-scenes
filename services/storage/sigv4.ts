import { createHash, createHmac } from "node:crypto";

/**
 * AWS Signature V4 query-string presigning for S3-compatible object storage
 * (Cloudflare R2, Backblaze B2). Produces time-limited GET URLs so bucket
 * credentials never leave the server.
 */

export type PresignOptions = {
  endpoint: string;
  region: string;
  bucket: string;
  key: string;
  accessKeyId: string;
  secretAccessKey: string;
  expiresInSeconds: number;
  now?: Date;
  /** Path-style (`endpoint/bucket/key`) vs virtual-hosted (`bucket.endpoint/key`). */
  virtualHosted?: boolean;
  responseContentDisposition?: string;
};

function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function amzDate(d: Date): { dateTime: string; date: string } {
  const dateTime = d.toISOString().replace(/[:-]/g, "").replace(/\.\d{3}/, "");
  return { dateTime, date: dateTime.slice(0, 8) };
}

export function presignGetObject(options: PresignOptions): string {
  const endpoint = new URL(options.endpoint);
  const host = options.virtualHosted ? `${options.bucket}.${endpoint.host}` : endpoint.host;
  const encodedKey = options.key.split("/").map(encodeRfc3986).join("/");
  const path = options.virtualHosted ? `/${encodedKey}` : `/${encodeRfc3986(options.bucket)}/${encodedKey}`;

  const { dateTime, date } = amzDate(options.now ?? new Date());
  const scope = `${date}/${options.region}/s3/aws4_request`;

  const params: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${options.accessKeyId}/${scope}`,
    "X-Amz-Date": dateTime,
    "X-Amz-Expires": String(options.expiresInSeconds),
    "X-Amz-SignedHeaders": "host",
  };
  if (options.responseContentDisposition) {
    params["response-content-disposition"] = options.responseContentDisposition;
  }

  const canonicalQuery = Object.keys(params)
    .sort()
    .map((k) => `${encodeRfc3986(k)}=${encodeRfc3986(params[k])}`)
    .join("&");

  const canonicalRequest = ["GET", path, canonicalQuery, `host:${host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    dateTime,
    scope,
    createHash("sha256").update(canonicalRequest, "utf8").digest("hex"),
  ].join("\n");

  const kDate = hmac(`AWS4${options.secretAccessKey}`, date);
  const kRegion = hmac(kDate, options.region);
  const kService = hmac(kRegion, "s3");
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");

  return `${endpoint.protocol}//${host}${path}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}
