import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";
import { ActionButton, AdminForm, ImageInput, OrderedPicker, Section, TextArea, TextInput, Toggle } from "@/components/admin/FormKit";
import { AdminPageHead, LinkButton } from "@/components/admin/ui";
import { deleteCollection, saveCollection } from "../curation-actions";

export async function CollectionEditor({ id }: { id: string | null }) {
  await requireAdmin("curation.write");
  const db = getDb();
  const [record, shows, playlists, packs] = await Promise.all([
    id ? db.collection.findUnique({ where: { id }, include: { items: { orderBy: { position: "asc" } } } }) : null,
    db.show.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    db.playlist.findMany({ where: { ownerId: null }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
    db.scenePack.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);
  if (id && !record) notFound();

  const options = [
    ...shows.map((s) => ({ value: `show:${s.id}`, label: s.title, group: "Show" })),
    ...playlists.map((p) => ({ value: `playlist:${p.id}`, label: p.title, group: "Playlist" })),
    ...packs.map((p) => ({ value: `scenepack:${p.id}`, label: p.title, group: "ScenePack" })),
  ];

  return (
    <>
      <AdminPageHead
        title={record ? record.title : "New collection"}
        crumbs={[{ label: "Collections", href: "/admin/collections" }]}
        actions={
          record && (
            <>
              <LinkButton href={`/collections/${record.slug}`} tone="secondary">
                View on site
              </LinkButton>
              <ActionButton action={deleteCollection} fields={{ id: record.id }} label="Delete" tone="danger" icon={<Trash2 size={15} aria-hidden />} confirm={`Delete "${record.title}"?`} />
            </>
          )
        }
      />
      <AdminForm action={saveCollection.bind(null, id)} submitLabel={record ? "Save changes" : "Create collection"}>
        <Section title="Details">
          <TextInput label="Title" name="title" defaultValue={record?.title} required maxLength={160} />
          <TextInput label="Slug" name="slug" defaultValue={record?.slug} hint="Leave blank to generate from the title" />
          <Toggle label="Featured on the homepage" name="featured" defaultChecked={record?.featured} />
          <TextArea label="Description" name="description" defaultValue={record?.description} maxLength={1000} rows={3} />
          <ImageInput label="Banner" name="artwork" current={record?.artworkUrl} aspect="21 / 9" />
        </Section>
        <Section title="Items" description="Shows, playlists and ScenePacks, in display order.">
          <OrderedPicker label="In this collection" name="items" defaultValue={record?.items.map((i) => `${i.type}:${i.targetId}`)} options={options} />
        </Section>
      </AdminForm>
    </>
  );
}
