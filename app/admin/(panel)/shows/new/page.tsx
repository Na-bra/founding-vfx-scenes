import { ShowEditor } from "../ShowEditor";

export const metadata = { title: "New show" };

export default async function Page({ searchParams }: PageProps<"/admin/shows/new">) {
  const sp = await searchParams;
  const id = Number(sp.tmdb);
  const type = sp.type === "movie" ? "movie" : "tv";
  const tmdb = Number.isInteger(id) && id > 0 ? { id, type: type as "tv" | "movie" } : undefined;
  return <ShowEditor id={null} tmdb={tmdb} />;
}
