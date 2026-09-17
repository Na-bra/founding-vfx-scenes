import { CharacterEditor } from "../CharacterEditor";

export const metadata = { title: "New character" };

export default async function Page({ searchParams }: PageProps<"/admin/characters/new">) {
  const show = (await searchParams).show;
  return <CharacterEditor id={null} showId={typeof show === "string" ? show : undefined} />;
}
