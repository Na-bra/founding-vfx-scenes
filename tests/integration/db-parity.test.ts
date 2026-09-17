/**
 * Compares the Supabase-backed repository with the demo repository after
 * `npm run db:seed -- --reset`. Hits the real database, so it only runs when
 * RUN_DB_TESTS=1:
 *
 *   RUN_DB_TESTS=1 npx vitest run tests/integration
 */
import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import { sampleRepository as sample } from "@/lib/data/sample/repository";
import { prismaRepository as database } from "@/lib/data/prisma/repository";
import { getDb } from "@/lib/db";

const slugs = (items: { slug: string }[]) => items.map((i) => i.slug).sort();

describe.runIf(process.env.RUN_DB_TESTS === "1")("database repository matches demo repository", () => {
  afterAll(() => getDb().$disconnect());

  it("lists the same published ScenePacks with identical details", async () => {
    const [a, b] = await Promise.all([sample.listScenePacks({ pageSize: 48 }), database.listScenePacks({ pageSize: 48 })]);
    expect(b.total).toBe(a.total);
    expect(slugs(b.items)).toEqual(slugs(a.items));
    const pick = (p: (typeof a.items)[number]) => ({ ...p, createdAt: undefined, updatedAt: undefined });
    const bySlug = new Map(b.items.map((p) => [p.slug, p]));
    for (const p of a.items) expect(pick(bySlug.get(p.slug)!)).toEqual(pick(p));
  });

  it("hides drafts and future scheduled packs", async () => {
    expect(await database.getScenePack("henry-hart-season-1-draft")).toBeNull();
    expect(await database.getScenePack("max-and-phoebe-twin-battles")).toBeNull();
  });

  it("matches shows, facets, playlists, collections, requests and search", async () => {
    expect(slugs(await database.listShows())).toEqual(slugs(await sample.listShows()));
    expect(await database.getScenePackFacets()).toEqual(await sample.getScenePackFacets());
    expect((await database.getPlaylist("superhero-sitcom-essentials"))?.scenePacks.map((p) => p.slug)).toEqual(
      (await sample.getPlaylist("superhero-sitcom-essentials"))?.scenePacks.map((p) => p.slug),
    );
    expect((await database.getShow("henry-danger"))?.seasons.map((s) => s.season)).toEqual(
      (await sample.getShow("henry-danger"))?.seasons.map((s) => s.season),
    );
    expect((await database.listRequests({ tab: "popular" })).map((r) => r.id)).toEqual(
      (await sample.listRequests({ tab: "popular" })).map((r) => r.id),
    );
    const [s1, s2] = await Promise.all([sample.search("1080p Thundermans Max"), database.search("1080p Thundermans Max")]);
    expect(slugs(s2.scenePacks)).toEqual(slugs(s1.scenePacks));
    expect(await database.getSiteCounts()).toEqual(await sample.getSiteCounts());
  });

  it("writes reports to the database", async () => {
    const { id } = await database.createReport({ scenePackId: "sp_eleven_s4", reason: "other", details: "parity test" });
    const row = await getDb().report.findUnique({ where: { id } });
    expect(row?.details).toBe("parity test");
    await getDb().report.delete({ where: { id } });
  });
});
