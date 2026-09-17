import { afterEach, describe, expect, it, vi } from "vitest";
import type { StorageObject } from "@/types/storage";
import { getStorageProvider } from "@/services/storage";
import { storageRepository } from "@/lib/data/storage";
import { resolveScenePackDownload } from "@/services/download";

const obj = (partial: Partial<StorageObject>): StorageObject => ({
  id: "so_1",
  scenePackId: "sp_eleven_s4",
  provider: "external_url",
  health: "unknown",
  ...partial,
});

describe("storage providers", () => {
  it("builds Google Drive links from a file id", async () => {
    const r = await getStorageProvider("google_drive").resolveDownload(obj({ provider: "google_drive", objectId: "abc123" }));
    expect(r).toEqual({ ok: true, url: "https://drive.google.com/file/d/abc123/view" });
  });

  it("rejects links on the wrong host for the provider", async () => {
    const r = await getStorageProvider("mega").resolveDownload(obj({ provider: "mega", downloadUrl: "https://evil.example/file" }));
    expect(r.ok).toBe(false);
  });

  it("rejects non-HTTPS links", async () => {
    const r = await getStorageProvider("external_url").resolveDownload(obj({ downloadUrl: "http://example.com/a.zip" }));
    expect(r.ok).toBe(false);
  });

  it("reports R2 as not configured without credentials", async () => {
    const r = await getStorageProvider("cloudflare_r2").resolveDownload(obj({ provider: "cloudflare_r2", objectId: "packs/a.zip" }));
    expect(r).toMatchObject({ ok: false, reason: "not_configured" });
  });

  it("presigns R2 downloads when configured", async () => {
    vi.stubEnv("R2_ACCOUNT_ID", "acc");
    vi.stubEnv("R2_BUCKET", "packs");
    vi.stubEnv("R2_ACCESS_KEY_ID", "key");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "secret");
    const r = await getStorageProvider("cloudflare_r2").resolveDownload(obj({ provider: "cloudflare_r2", objectId: "eleven/s4.zip" }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.url).toMatch(/^https:\/\/acc\.r2\.cloudflarestorage\.com\/packs\/eleven\/s4\.zip\?/);
      expect(r.url).toContain("X-Amz-Signature=");
      expect(r.url).not.toContain("secret");
    }
  });
});

describe("resolveScenePackDownload", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns not_found for unknown or unpublished packs", async () => {
    expect(await resolveScenePackDownload("nope")).toEqual({ status: "not_found" });
    expect(await resolveScenePackDownload("henry-hart-season-1-draft")).toEqual({ status: "not_found" });
  });

  it("is unavailable when no file is attached", async () => {
    expect(await resolveScenePackDownload("eleven-season-4")).toMatchObject({ status: "unavailable" });
  });

  it("redirects to the provider destination when configured", async () => {
    vi.spyOn(storageRepository, "getForScenePack").mockResolvedValue(
      obj({ provider: "external_url", downloadUrl: "https://files.example.com/eleven.zip" }),
    );
    expect(await resolveScenePackDownload("eleven-season-4")).toEqual({ status: "redirect", url: "https://files.example.com/eleven.zip" });
  });

  it("degrades to unavailable when the provider throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(storageRepository, "getForScenePack").mockRejectedValue(new Error("boom"));
    expect(await resolveScenePackDownload("eleven-season-4")).toMatchObject({ status: "unavailable" });
  });

  it("stays direct when monetization is requested but not configured", async () => {
    vi.stubEnv("MONETIZATION_DOWNLOAD_MODE", "monetized");
    vi.spyOn(storageRepository, "getForScenePack").mockResolvedValue(obj({ downloadUrl: "https://files.example.com/x.zip" }));
    expect(await resolveScenePackDownload("eleven-season-4")).toEqual({ status: "redirect", url: "https://files.example.com/x.zip" });
  });
});

describe("TeraBox links", () => {
  const link = (url: string) =>
    getStorageProvider("terabox").resolveDownload({ id: "1", scenePackId: "p", provider: "terabox", downloadUrl: url, health: "unknown" });

  it("accepts TeraBox share domains and subdomains", async () => {
    for (const url of [
      "https://terabox.com/s/1abcDEF",
      "https://www.terabox.app/sharing/link?surl=abc123",
      "https://1024terabox.com/s/1xyz",
      "https://www.4funbox.com/s/1xyz",
      "https://nephobox.com/s/1xyz",
      "https://terasharelink.com/s/1xyz",
    ]) {
      expect((await link(url)).ok, url).toBe(true);
    }
  });

  it("rejects look-alike and non-TeraBox hosts", async () => {
    for (const url of ["https://terabox.com.evil.net/s/1", "https://notterabox.com/s/1", "http://terabox.com/s/1"]) {
      expect((await link(url)).ok, url).toBe(false);
    }
  });
});
