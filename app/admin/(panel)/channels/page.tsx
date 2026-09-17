import { TaxonomyList } from "../TaxonomyPages";

export const metadata = { title: "Channels" };

export default async function Page({ searchParams }: PageProps<"/admin/channels">) {
  const q = (await searchParams).q;
  return <TaxonomyList kind="channel" q={typeof q === "string" ? q : undefined} />;
}
