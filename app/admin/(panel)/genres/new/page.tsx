import { TaxonomyEditor } from "../../TaxonomyPages";

export const metadata = { title: "New genre" };

export default function Page() {
  return <TaxonomyEditor kind="genre" id={null} />;
}
