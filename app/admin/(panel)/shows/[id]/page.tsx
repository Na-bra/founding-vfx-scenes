import { ShowEditor } from "../ShowEditor";

export const metadata = { title: "Edit show" };

export default async function Page({ params }: PageProps<"/admin/shows/[id]">) {
  return <ShowEditor id={(await params).id} />;
}
