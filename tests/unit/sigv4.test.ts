import { describe, expect, it } from "vitest";
import { presignGetObject } from "@/services/storage/sigv4";

describe("presignGetObject", () => {
  // Reference vector from the AWS S3 "Authenticating Requests: Using Query Parameters" documentation.
  it("matches the AWS documented example signature", () => {
    const url = presignGetObject({
      endpoint: "https://s3.amazonaws.com",
      region: "us-east-1",
      bucket: "examplebucket",
      key: "test.txt",
      accessKeyId: "AKIAIOSFODNN7EXAMPLE",
      secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      expiresInSeconds: 86400,
      now: new Date("2013-05-24T00:00:00Z"),
      virtualHosted: true,
    });

    expect(url).toContain("https://examplebucket.s3.amazonaws.com/test.txt?");
    expect(url).toContain("X-Amz-Signature=aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404");
  });

  it("encodes keys with spaces and keeps path separators", () => {
    const url = presignGetObject({
      endpoint: "https://acc.r2.cloudflarestorage.com",
      region: "auto",
      bucket: "packs",
      key: "henry danger/pack (1).zip",
      accessKeyId: "a",
      secretAccessKey: "b",
      expiresInSeconds: 60,
    });
    expect(url).toContain("/packs/henry%20danger/pack%20%281%29.zip?");
  });
});
