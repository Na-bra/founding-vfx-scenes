import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";
import { ActionButton, AdminForm, ImageInput, OrderedPicker, Section, SelectInput, TextArea, TextInput, Toggle } from "@/components/admin/FormKit";
import { AdminPageHead, LinkButton } from "@/components/admin/ui";
import { deletePlaylist, savePlaylist } from "../curation-actions";

export async function PlaylistEditor({ id }: { id: string | null }) {
  await requireAdmin("curation.write");
  const db = getDb();
  const [record, packs] = await Promise.all([
    id ? db.playlist.findFirst({ where: { id, ownerId: null }, include: { items: { orderBy: { position: "asc" } } } }) : null,
    db.scenePack.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true, status: true, show: { select: { title: true } } } }),
  ]);
  if (id && !record) notFound();

  return (
    <>
      <AdminPageHead
        title={record ? record.title : "New playlist"}
        crumbs={[{ label: "Playlists", href: "/admin/playlists" }]}
        actions={
          record && (
            <>
              {record.visibility !== "private" && (
                <LinkButton href={`/playlists/${record.slug}`} tone="secondary">
                  View on site
                </LinkButton>
              )}
              <ActionButton action={deletePlaylist} fields={{ id: record.id }} label="Delete" tone="danger" icon={<Trash2 size={15} aria-hidden />} confirm={`Delete "${record.title}"?`} />
            </>
          )
        }
      />
      <AdminForm action={savePlaylist.bind(null, id)} submitLabel={record ? "Save changes" : "Create playlist"}>
        <Section title="Details">
          <TextInput label="Title" name="title" defaultValue={record?.title} required maxLength={160} />
          <TextInput label="Slug" name="slug" defaultValue={record?.slug} hint="Leave blank to generate from the title" />
          <SelectInput
            label="Visibility"
            name="visibility"
            defaultValue={record?.visibility ?? "public"}
            options={[
              { value: "public", label: "Public — listed on the site" },
              { value: "unlisted", label: "Unlisted — only people with the link" },
              { value: "private", label: "Private — hidden" },
            ]}
          />
          <Toggle label="Featured on the homepage" name="featured" defaultChecked={record?.featured} />
          <TextArea label="Description" name="description" defaultValue={record?.description} maxLength={1000} rows={3} />
          <ImageInput label="Cover image" name="thumbnail" current={record?.thumbnailUrl} hint="Optional — otherwise the first ScenePacks are used" />
        </Section>
        <Section title="ScenePacks" description="Drag to reorder, or use the arrows. Drafts are included but hidden on the site until published.">
          <OrderedPicker
            label="In this playlist"
            name="scenePackIds"
            defaultValue={record?.items.map((i) => i.scenePackId)}
            options={packs.map((p) => ({ value: p.id, label: p.status === "draft" ? `${p.title} (draft)` : p.title, group: p.show.title }))}
          />
        </Section>
      </AdminForm>
    </>
  );
}
