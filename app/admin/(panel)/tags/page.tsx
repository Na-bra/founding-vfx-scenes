import { Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { can } from "@/lib/admin/permissions";
import { getDb } from "@/lib/db";
import { ActionButton, AdminForm, Section, TextInput } from "@/components/admin/FormKit";
import { AdminPageHead, DataTable, adminStyles as styles } from "@/components/admin/ui";
import { createTag, deleteTag } from "../catalog-actions";

export const metadata = { title: "Tags" };

export default async function TagsPage() {
  const admin = await requireAdmin("catalog.write");
  const tags = await getDb().tag.findMany({ orderBy: { label: "asc" }, include: { _count: { select: { scenePacks: true } } } });

  return (
    <>
      <AdminPageHead title="Tags" description="Searchable, clickable labels on ScenePacks. You can also create tags while editing a ScenePack." />
      <AdminForm action={createTag} submitLabel="Add tag">
        <Section title="New tag">
          <TextInput label="Tag" name="label" placeholder="e.g. superhero" maxLength={40} required />
          <TextInput label="Slug" name="slug" hint="Optional — generated from the tag" maxLength={80} />
        </Section>
      </AdminForm>
      <DataTable
        rows={tags}
        rowKey={(t) => t.slug}
        empty="No tags yet."
        columns={[
          { header: "Tag", cell: (t) => <strong>#{t.label}</strong> },
          { header: "Slug", cell: (t) => <span className={styles.muted}>{t.slug}</span> },
          { header: "ScenePacks", cell: (t) => t._count.scenePacks },
          {
            header: "",
            cell: (t) =>
              can(admin.role, "catalog.delete") && (
                <div className={styles.rowActions}>
                  <ActionButton action={deleteTag} fields={{ slug: t.slug }} label="Delete" tone="danger" icon={<Trash2 size={14} aria-hidden />} confirm={`Delete #${t.label}? It will be removed from ${t._count.scenePacks} ScenePacks.`} />
                </div>
              ),
          },
        ]}
      />
    </>
  );
}
