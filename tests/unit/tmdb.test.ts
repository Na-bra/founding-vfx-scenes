import { afterEach, describe, expect, it, vi } from "vitest";
import { getTmdbDetails, isTmdbConfigured, searchTmdb } from "@/services/metadata/tmdb";

function mockFetch(payload: unknown) {
  const calls: string[] = [];
  vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
  });
  return calls;
}

describe("TMDB metadata", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("reports whether a key is configured", () => {
    vi.stubEnv("TMDB_API_KEY", "");
    expect(isTmdbConfigured()).toBe(false);
    vi.stubEnv("TMDB_API_KEY", "abc");
    expect(isTmdbConfigured()).toBe(true);
  });

  it("sends v4 tokens as a bearer header and v3 keys in the query", async () => {
    vi.stubEnv("TMDB_API_KEY", "eyJhbGciOi.test");
    let calls = mockFetch({ results: [] });
    await searchTmdb("henry");
    expect(calls[0]).not.toContain("api_key=");

    vi.unstubAllGlobals();
    vi.stubEnv("TMDB_API_KEY", "plainv3key");
    calls = mockFetch({ results: [] });
    await searchTmdb("henry");
    expect(calls[0]).toContain("api_key=plainv3key");
  });

  it("keeps only TV and film results", async () => {
    vi.stubEnv("TMDB_API_KEY", "k");
    mockFetch({
      results: [
        { id: 1, media_type: "tv", name: "Henry Danger", first_air_date: "2014-07-26", overview: "o", poster_path: "/p.jpg" },
        { id: 2, media_type: "person", name: "Jace Norman" },
        { id: 3, media_type: "movie", title: "Zombies", release_date: "2018-02-16" },
      ],
    });
    const results = await searchTmdb("henry");
    expect(results.map((r) => r.title)).toEqual(["Henry Danger", "Zombies"]);
    expect(results[0]).toMatchObject({ mediaType: "tv", year: 2014, posterUrl: "https://image.tmdb.org/t/p/w185/p.jpg" });
  });

  it("normalizes a series: years, seasons, network, genres and cast", async () => {
    vi.stubEnv("TMDB_API_KEY", "k");
    mockFetch({
      id: 61852,
      name: "Henry Danger",
      overview: "A teen becomes a superhero's sidekick.",
      first_air_date: "2014-07-26",
      last_air_date: "2020-03-21",
      in_production: false,
      status: "Ended",
      genres: [{ name: "Comedy" }, { name: "Action & Adventure" }],
      networks: [{ name: "Nickelodeon" }],
      poster_path: "/poster.jpg",
      backdrop_path: "/backdrop.jpg",
      seasons: [
        { season_number: 0, air_date: "2014-01-01", episode_count: 3 },
        { season_number: 1, air_date: "2014-07-26", episode_count: 26 },
        { season_number: 2, air_date: "2015-09-12", episode_count: 22 },
      ],
      alternative_titles: { results: [{ title: "Kid Danger" }, { title: "Henry Danger" }] },
      aggregate_credits: {
        cast: [
          { name: "Jace Norman", profile_path: "/j.jpg", roles: [{ character: "Henry Hart / Kid Danger" }] },
          { name: "Cooper Barnes", profile_path: null, roles: [{ character: "Ray Manchester" }] },
        ],
      },
    });

    const d = await getTmdbDetails(61852, "tv");
    expect(d).toMatchObject({
      title: "Henry Danger",
      yearStart: 2014,
      yearEnd: 2020,
      ongoing: false,
      network: "Nickelodeon",
      genres: ["Comedy", "Action & Adventure"],
      aliases: ["Kid Danger"],
      posterUrl: "https://image.tmdb.org/t/p/original/poster.jpg",
      bannerUrl: "https://image.tmdb.org/t/p/original/backdrop.jpg",
    });
    // Specials (season 0) are dropped.
    expect(d.seasons).toEqual([
      { number: 1, year: 2014, episodeCount: 26 },
      { number: 2, year: 2015, episodeCount: 22 },
    ]);
    expect(d.cast).toEqual([
      { name: "Henry Hart", actor: "Jace Norman", profileUrl: "https://image.tmdb.org/t/p/w500/j.jpg" },
      { name: "Ray Manchester", actor: "Cooper Barnes", profileUrl: null },
    ]);
  });

  it("leaves the end year open for a running series", async () => {
    vi.stubEnv("TMDB_API_KEY", "k");
    mockFetch({ id: 1, name: "Wednesday", first_air_date: "2022-11-23", in_production: true, status: "Returning Series", seasons: [] });
    const d = await getTmdbDetails(1, "tv");
    expect(d).toMatchObject({ ongoing: true, yearStart: 2022, yearEnd: null });
  });

  it("normalizes a film: single year, company as channel, credits cast", async () => {
    vi.stubEnv("TMDB_API_KEY", "k");
    mockFetch({
      id: 460465,
      title: "Zombies",
      release_date: "2018-02-16",
      genres: [{ name: "Music" }],
      production_companies: [{ name: "Disney Channel" }],
      credits: { cast: [{ name: "Milo Manheim", character: "Zed", profile_path: "/m.jpg" }] },
    });
    const d = await getTmdbDetails(460465, "movie");
    expect(d).toMatchObject({ title: "Zombies", yearStart: 2018, yearEnd: 2018, network: "Disney Channel", seasons: [] });
    expect(d.cast[0]).toMatchObject({ name: "Zed", actor: "Milo Manheim" });
  });

  it("throws a clean error when TMDB fails", async () => {
    vi.stubEnv("TMDB_API_KEY", "k");
    vi.stubGlobal("fetch", async () => new Response("nope", { status: 401 }));
    await expect(searchTmdb("x")).rejects.toThrow(/401/);
  });
});
