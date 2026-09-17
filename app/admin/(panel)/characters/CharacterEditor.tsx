import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { can } from "@/lib/admin/permissions";
import { getDb } from "@/lib/db";
import { ActionButton, AdminForm, ImageInput, Section, SelectInput, TextArea, TextInput } from "@/components/admin/FormKit";
import { AdminPageHead, LinkButton } from "@/components/admin/ui";
import { deleteCharacter, saveCharacter } from "../catalog-actions";

export async function CharacterEditor({ id, showId }: { id: string | null; showId?: string }) {
  const admin = await requireAdmin("catalog.write");
  const db = getDb();
  const [record, shows] = await Promise.all([
    id ? db.character.findUnique({ where: { id } }) : null,
    db.show.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);
  if (id && !record) notFound();

  return (
    <>
      <AdminPageHead
        title={record ? record.name : "New character"}
        crumbs={[{ label: "Characters", href: "/admin/characters" }]}
        actions={
          record && (
            <>
              <LinkButton href={`/characters/${record.slug}`} tone="secondary">
                View on site
              </LinkButton>
              {can(admin.role, "catalog.delete") && (
                <ActionButton action={deleteCharacter} fields={{ id: record.id }} label="Delete" tone="danger" icon={<Trash2 size={15} aria-hidden />} confirm={`Delete ${record.name}? They'll be removed from their ScenePacks.`} />
              )}
            </>
          )
        }
      />
      <AdminForm action={saveCharacter.bind(null, id)} submitLabel={record ? "Save changes" : "Create character"}>
        <Section title="Details">
          <TextInput label="Name" name="name" defaultValue={record?.name} required maxLength={120} />
          <TextInput label="Slug" name="slug" defaultValue={record?.slug} hint="Leave blank to generate from the name" />
          <SelectInput
            label="Show"
            name="showId"
            defaultValue={record?.showId ?? showId ?? ""}
            placeholder="Choose a show…"
            options={shows.map((s) => ({ value: s.id, label: s.title }))}
          />
          <TextInput label="Actor" name="actor" defaultValue={record?.actor ?? ""} hint="Optional" maxLength={120} />
          <TextInput label="Also known as" name="aliases" defaultValue={record?.aliases.join(", ")} hint="Comma-separated. Used by search." wide />
          <TextArea label="Description" name="description" defaultValue={record?.description} maxLength={1000} rows={3} />
          <ImageInput label="Artwork" name="artwork" current={record?.artworkUrl} aspect="1 / 1" />
        </Section>
      </AdminForm>
    </>
  );
}
