import { TaxonomyEditor } from "../../TaxonomyPages";

export const metadata = { title: "Edit channel" };

export default async function Page({ params }: PageProps<"/admin/channels/[id]">) {
  return <TaxonomyEditor kind="channel" id={(await params).id} />;
}
