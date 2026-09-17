import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";
import { ActionButton, AdminForm, ImageInput, Section, TextArea, TextInput } from "@/components/admin/FormKit";
import { AdminPageHead, DataTable, LinkButton, SearchBox, Thumb, adminStyles as styles } from "@/components/admin/ui";
import { deleteChannel, deleteGenre, saveChannel, saveGenre } from "./taxonomy-actions";

type Kind = "channel" | "genre";

const LABELS: Record<Kind, { singular: string; plural: string; path: string; description: string }> = {
  channel: { singular: "Channel", plural: "Channels", path: "/admin/channels", description: "Networks and streaming platforms." },
  genre: { singular: "Genre", plural: "Genres", path: "/admin/genres", description: "Moods and categories used across shows and ScenePacks." },
};

export async function TaxonomyList({ kind, q }: { kind: Kind; q?: string }) {
  await requireAdmin("taxonomy.write");
  const db = getDb();
  const L = LABELS[kind];
  const where = q ? { name: { contains: q, mode: "insensitive" as const } } : {};
  type Row = { id: string; name: string; slug: string; artworkUrl: string | null; count: string };
  const rows: Row[] =
    kind === "channel"
      ? (await db.channel.findMany({ where, orderBy: { name: "asc" }, include: { _count: { select: { shows: true } } } })).map((r) => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          artworkUrl: r.artworkUrl,
          count: `${r._count.shows} shows`,
        }))
      : (
          await db.genre.findMany({ where, orderBy: { name: "asc" }, include: { _count: { select: { shows: true, scenePacks: true } } } })
        ).map((r) => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          artworkUrl: r.artworkUrl,
          count: `${r._count.shows} shows · ${r._count.scenePacks} packs`,
        }));

  return (
    <>
      <AdminPageHead
        title={L.plural}
        description={L.description}
        actions={
          <LinkButton href={`${L.path}/new`}>
            <Plus size={16} aria-hidden /> New {L.singular.toLowerCase()}
          </LinkButton>
        }
      />
      <div className={styles.toolbar}>
        <SearchBox defaultValue={q} placeholder={`Search ${L.plural.toLowerCase()}`} />
      </div>
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        empty={`No ${L.plural.toLowerCase()} yet.`}
        columns={[
          {
            header: "Name",
            cell: (r) => (
              <span className={styles.cellTitle}>
                <Thumb src={r.artworkUrl} />
                <Link href={`${L.path}/${r.id}`}>{r.name}</Link>
              </span>
            ),
          },
          { header: "Slug", cell: (r) => <span className={styles.muted}>{r.slug}</span> },
          { header: "Used by", cell: (r) => <span className={styles.muted}>{r.count}</span>, className: styles.nowrap },
        ]}
      />
    </>
  );
}

export async function TaxonomyEditor({ kind, id }: { kind: Kind; id: string | null }) {
  await requireAdmin("taxonomy.write");
  const L = LABELS[kind];
  const db = getDb();
  const record = id ? await (kind === "channel" ? db.channel.findUnique({ where: { id } }) : db.genre.findUnique({ where: { id } })) : null;
  if (id && !record) notFound();

  const save = (kind === "channel" ? saveChannel : saveGenre).bind(null, id);
  const remove = kind === "channel" ? deleteChannel : deleteGenre;

  return (
    <>
      <AdminPageHead
        title={record ? record.name : `New ${L.singular.toLowerCase()}`}
        crumbs={[{ label: L.plural, href: L.path }]}
        actions={
          record && (
            <>
              <LinkButton href={`/${kind}s/${record.slug}`} tone="secondary">
                View on site
              </LinkButton>
              <ActionButton
                action={remove}
                fields={{ id: record.id }}
                label="Delete"
                tone="danger"
                icon={<Trash2 size={15} aria-hidden />}
                confirm={`Delete ${record.name}? This can't be undone.`}
              />
            </>
          )
        }
      />
      <AdminForm action={save} submitLabel={record ? "Save changes" : `Create ${L.singular.toLowerCase()}`}>
        <Section title="Details">
          <TextInput label="Name" name="name" defaultValue={record?.name} required maxLength={80} />
          <TextInput label="Slug" name="slug" defaultValue={record?.slug} hint="Leave blank to generate from the name" maxLength={80} />
          <TextArea label="Description" name="description" defaultValue={record?.description} maxLength={600} rows={3} />
          <ImageInput label="Artwork" name="artwork" current={record?.artworkUrl} />
        </Section>
      </AdminForm>
    </>
  );
}
