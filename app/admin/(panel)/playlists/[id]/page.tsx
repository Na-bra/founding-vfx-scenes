import { PlaylistEditor } from "../PlaylistEditor";

export const metadata = { title: "Edit playlist" };

export default async function Page({ params }: PageProps<"/admin/playlists/[id]">) {
  return <PlaylistEditor id={(await params).id} />;
}
