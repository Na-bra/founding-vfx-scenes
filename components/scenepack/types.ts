import type { ScenePackView } from "@/types/content";

/** The subset of a ScenePack sent to client components (quick view, favorites). */
export type ScenePackPreview = Pick<
  ScenePackView,
  "id" | "slug" | "title" | "description" | "season" | "episode" | "thumbnail" | "publishedAt" | "technical"
> & {
  show: Pick<ScenePackView["show"], "slug" | "title">;
  channel: Pick<ScenePackView["channel"], "slug" | "name">;
  characters: Pick<ScenePackView["characters"][number], "slug" | "name">[];
  genres: Pick<ScenePackView["genres"][number], "slug" | "name">[];
};

export function toPreview(p: ScenePackView): ScenePackPreview {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    season: p.season,
    episode: p.episode,
    thumbnail: p.thumbnail,
    publishedAt: p.publishedAt,
    technical: p.technical,
    show: { slug: p.show.slug, title: p.show.title },
    channel: { slug: p.channel.slug, name: p.channel.name },
    characters: p.characters.map(({ slug, name }) => ({ slug, name })),
    genres: p.genres.map(({ slug, name }) => ({ slug, name })),
  };
}
