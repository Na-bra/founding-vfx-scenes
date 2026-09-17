import { ScenePackEditor } from "../ScenePackEditor";

export const metadata = { title: "Edit ScenePack" };

export default async function Page({ params }: PageProps<"/admin/scenepacks/[id]">) {
  return <ScenePackEditor id={(await params).id} />;
}
