import { TaxonomyEditor } from "../../TaxonomyPages";

export const metadata = { title: "New channel" };

export default function Page() {
  return <TaxonomyEditor kind="channel" id={null} />;
}
