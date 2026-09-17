import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getRepository } from "@/lib/data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const repo = getRepository();
  const [packs, shows, characters, channels, genres, playlists, collections] = await Promise.all([
    repo.listScenePacks({ pageSize: 48 }).then(async (first) => {
      const pages = await Promise.all(
        Array.from({ length: first.pageCount - 1 }, (_, i) => repo.listScenePacks({ pageSize: 48, page: i + 2 })),
      );
      return [first, ...pages].flatMap((p) => p.items);
    }),
    repo.listShows(),
    repo.listCharacters(),
    repo.listChannels(),
    repo.listGenres(),
    repo.listPlaylists(),
    repo.listCollections(),
  ]);

  const url = (path: string) => `${siteConfig.url}${path}`;
  const staticPaths = ["/", "/scenepacks", "/shows", "/characters", "/channels", "/genres", "/playlists", "/collections", "/requests", "/changelog", "/contact"];

  return [
    ...staticPaths.map((p) => ({ url: url(p), changeFrequency: "daily" as const, priority: p === "/" ? 1 : 0.8 })),
    ...packs.map((p) => ({ url: url(`/scenepacks/${p.slug}`), lastModified: p.updatedAt, priority: 0.9 })),
    ...shows.map((s) => ({ url: url(`/shows/${s.slug}`), priority: 0.8 })),
    ...characters.map((c) => ({ url: url(`/characters/${c.slug}`), priority: 0.6 })),
    ...channels.map((c) => ({ url: url(`/channels/${c.slug}`), priority: 0.6 })),
    ...genres.map((g) => ({ url: url(`/genres/${g.slug}`), priority: 0.5 })),
    ...playlists.map((p) => ({ url: url(`/playlists/${p.slug}`), lastModified: p.updatedAt, priority: 0.6 })),
    ...collections.map((c) => ({ url: url(`/collections/${c.slug}`), lastModified: c.updatedAt, priority: 0.6 })),
  ];
}
