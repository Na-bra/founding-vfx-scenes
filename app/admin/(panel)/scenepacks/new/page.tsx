import { ScenePackEditor } from "../ScenePackEditor";

export const metadata = { title: "New ScenePack" };

export default async function Page({ searchParams }: PageProps<"/admin/scenepacks/new">) {
  const show = (await searchParams).show;
  return <ScenePackEditor id={null} showId={typeof show === "string" ? show : undefined} />;
}
