import { TaxonomyList } from "../TaxonomyPages";

export const metadata = { title: "Genres" };

export default async function Page({ searchParams }: PageProps<"/admin/genres">) {
  const q = (await searchParams).q;
  return <TaxonomyList kind="genre" q={typeof q === "string" ? q : undefined} />;
}
