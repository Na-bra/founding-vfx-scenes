import { CollectionEditor } from "../CollectionEditor";

export const metadata = { title: "Edit collection" };

export default async function Page({ params }: PageProps<"/admin/collections/[id]">) {
  return <CollectionEditor id={(await params).id} />;
}
