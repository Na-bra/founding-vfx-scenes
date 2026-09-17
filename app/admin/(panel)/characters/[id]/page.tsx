import { CharacterEditor } from "../CharacterEditor";

export const metadata = { title: "Edit character" };

export default async function Page({ params }: PageProps<"/admin/characters/[id]">) {
  return <CharacterEditor id={(await params).id} />;
}
