import { describe, expect, it } from "vitest";
import { sampleRepository as repo } from "@/lib/data/sample/repository";

describe("sample repository", () => {
  it("never exposes drafts or not-yet-due scheduled packs", async () => {
    const { items } = await repo.listScenePacks({ pageSize: 48 });
    const slugs = items.map((p) => p.slug);
    expect(slugs).not.toContain("henry-hart-season-1-draft");
    expect(slugs).not.toContain("max-and-phoebe-twin-battles");
    expect(await repo.getScenePack("henry-hart-season-1-draft")).toBeNull();
  });

  it("combines multiple filters", async () => {
    const { items } = await repo.listScenePacks({ channel: "nickelodeon", resolution: "1080p", fps: 60 });
    expect(items.length).toBeGreaterThan(0);
    for (const p of items) {
      expect(p.channel.slug).toBe("nickelodeon");
      expect(p.technical.resolution).toBe("1080p");
      expect(p.technical.fps).toBe(60);
    }
  });

  it("finds shows, characters and packs for 'Henry'", async () => {
    const r = await repo.search("Henry");
    expect(r.shows.map((s) => s.title)).toContain("Henry Danger");
    expect(r.characters.map((c) => c.name)).toContain("Henry Hart");
    expect(r.scenePacks.length).toBeGreaterThan(0);
  });

  it("applies structured terms from the query", async () => {
    const r = await repo.search("1080p Thundermans Max");
    expect(r.scenePacks.map((p) => p.slug)).toEqual(["max-thunderman-villain-era"]);
  });

  it("matches aliases", async () => {
    const r = await repo.search("kid danger");
    expect(r.characters.map((c) => c.slug)).toContain("henry-hart");
  });

  it("recommends packs sharing show or character first", async () => {
    const similar = await repo.getSimilarScenePacks("sp_henry_hart_s5", 3);
    expect(similar[0].show.slug).toBe("henry-danger");
  });

  it("clamps pagination", async () => {
    const page = await repo.listScenePacks({ page: 999, pageSize: 5 });
    expect(page.page).toBe(page.pageCount);
  });

  it("avoids recently seen packs for Surprise Me when possible", async () => {
    const { items } = await repo.listScenePacks({ pageSize: 48 });
    const keep = items[0].id;
    const pick = await repo.getRandomScenePack(items.filter((p) => p.id !== keep).map((p) => p.id));
    expect(pick?.id).toBe(keep);
  });
});

describe("hidden shows", () => {
  it("hide their ScenePacks and characters instead of crashing", async () => {
    const { buildMemoryRepository } = await import("@/lib/data/memory/repository");
    const { characters, channels, genres, shows, tags } = await import("@/lib/data/sample/taxonomy");
    const { scenePacks } = await import("@/lib/data/sample/scenepacks");
    const { announcements, changelog, collections, playlists, requests } = await import("@/lib/data/sample/community");
    const repo = buildMemoryRepository(
      { channels, genres, tags, shows: shows.filter((s) => s.slug !== "henry-danger"), characters, scenePacks, playlists, collections, requests, announcements, changelog },
      { source: "sample", createReport: async () => ({ id: "x" }) },
    );
    const { items } = await repo.listScenePacks({ pageSize: 48 });
    expect(items.some((p) => p.show.slug === "henry-danger")).toBe(false);
    expect((await repo.listCharacters()).some((c) => c.slug === "henry-hart")).toBe(false);
    expect(await repo.getPlaylist("superhero-sitcom-essentials")).not.toBeNull();
    expect((await repo.search("henry")).total).toBeGreaterThanOrEqual(0);
  });
});
