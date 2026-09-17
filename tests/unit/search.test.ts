import { describe, expect, it } from "vitest";
import { parseSearchQuery } from "@/lib/search/query-parser";
import { normalize, scoreDocument, tokenize } from "@/lib/search/text";

describe("normalize", () => {
  it("strips accents, punctuation and case", () => {
    expect(normalize("  Zombies: Addison’s Café!! ")).toBe("zombies addisons cafe");
  });
});

describe("scoreDocument", () => {
  const fields = [
    { text: "Henry Danger", weight: 5 },
    { text: "Kid Danger Captain Man", weight: 3 },
  ];

  it("matches word prefixes", () => {
    expect(scoreDocument(tokenize("henry dan"), fields)).toBeGreaterThan(0);
  });

  it("requires every token to match", () => {
    expect(scoreDocument(tokenize("henry thunder"), fields)).toBe(0);
  });

  it("ranks exact phrases above prefixes", () => {
    expect(scoreDocument(tokenize("henry danger"), fields)).toBeGreaterThan(scoreDocument(tokenize("hen dang"), fields));
  });
});

describe("parseSearchQuery", () => {
  it("extracts resolution and fps from natural queries", () => {
    const q = parseSearchQuery("1080p Henry Danger Max scenes 60fps");
    expect(q.resolution).toBe("1080p");
    expect(q.fps).toBe(60);
    expect(q.text).toBe("henry danger max scenes");
  });

  it("understands spaced fps, 4k and season shorthands", () => {
    expect(parseSearchQuery("eleven 4k 24 fps")).toMatchObject({ resolution: "4K", fps: 24, text: "eleven" });
    expect(parseSearchQuery("wednesday s1e4")).toMatchObject({ season: 1, episode: 4, text: "wednesday" });
    expect(parseSearchQuery("henry season 5")).toMatchObject({ season: 5, text: "henry" });
  });
});

describe("parseScenePackQuery", async () => {
  const { parseScenePackQuery } = await import("@/lib/scenepack-query");

  it("keeps valid params and drops invalid ones individually", () => {
    const q = parseScenePackQuery(new URLSearchParams("channel=netflix&fps=abc&resolution=8K&sort=newest&genre=<script>&page=2"));
    expect(q).toEqual({ channel: "netflix", sort: "newest", page: 2 });
  });
});
