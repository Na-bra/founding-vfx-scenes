import { TaxonomyEditor } from "../../TaxonomyPages";

export const metadata = { title: "Edit genre" };

export default async function Page({ params }: PageProps<"/admin/genres/[id]">) {
  return <TaxonomyEditor kind="genre" id={(await params).id} />;
}
