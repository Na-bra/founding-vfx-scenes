import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { can } from "@/lib/admin/permissions";
import { getDb } from "@/lib/db";
import { ActionButton, AdminForm, CheckboxGroup, ImageInput, SeasonRows, Section, SelectInput, TextArea, TextInput } from "@/components/admin/FormKit";
import { AdminPageHead, LinkButton, adminStyles as styles } from "@/components/admin/ui";
import { deleteShow, saveShow } from "../catalog-actions";

export async function ShowEditor({ id }: { id: string | null }) {
  const admin = await requireAdmin("catalog.write");
  const db = getDb();
  const [record, channels, genres] = await Promise.all([
    id
      ? db.show.findUnique({
          where: { id },
          include: { genres: true, seasons: { orderBy: { number: "asc" } }, characters: { orderBy: { name: "asc" } }, _count: { select: { scenePacks: true } } },
        })
      : null,
    db.channel.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.genre.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (id && !record) notFound();

  return (
    <>
      <AdminPageHead
        title={record ? record.title : "New show"}
        crumbs={[{ label: "Shows", href: "/admin/shows" }]}
        actions={
          record && (
            <>
              <LinkButton href={`/admin/scenepacks/new?show=${record.id}`} tone="secondary">
                <Plus size={15} aria-hidden /> ScenePack
              </LinkButton>
              {record.status === "published" && (
                <LinkButton href={`/shows/${record.slug}`} tone="secondary">
                  View on site
                </LinkButton>
              )}
              {can(admin.role, "catalog.delete") && (
                <ActionButton action={deleteShow} fields={{ id: record.id }} label="Delete" tone="danger" icon={<Trash2 size={15} aria-hidden />} confirm={`Delete ${record.title}?`} />
              )}
            </>
          )
        }
      />
      <AdminForm action={saveShow.bind(null, id)} submitLabel={record ? "Save changes" : "Create show"}>
        <Section title="Details">
          <TextInput label="Title" name="title" defaultValue={record?.title} required maxLength={160} />
          <TextInput label="Slug" name="slug" defaultValue={record?.slug} hint="Leave blank to generate from the title" />
          <SelectInput
            label="Format"
            name="format"
            defaultValue={record?.format ?? "series"}
            options={[
              { value: "series", label: "Series" },
              { value: "film", label: "Film" },
              { value: "special", label: "Special" },
            ]}
          />
          <SelectInput label="Channel" name="channelId" defaultValue={record?.channelId ?? ""} placeholder="Choose a channel…" options={channels.map((c) => ({ value: c.id, label: c.name }))} />
          <TextInput label="First year" name="yearStart" type="number" min={1900} max={2100} defaultValue={record?.yearStart} required />
          <TextInput label="Last year" name="yearEnd" type="number" min={1900} max={2100} defaultValue={record?.yearEnd ?? ""} hint="Blank if still running" />
          <SelectInput
            label="Visibility"
            name="status"
            defaultValue={record?.status === "scheduled" ? "published" : (record?.status ?? "published")}
            options={[
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft — hidden" },
              { value: "unpublished", label: "Unpublished — hidden" },
            ]}
            hint="Hidden shows also hide their ScenePacks"
          />
          <TextInput label="Also known as" name="aliases" defaultValue={record?.aliases.join(", ")} hint="Comma-separated. Used by search." wide />
          <TextArea label="Description" name="description" defaultValue={record?.description} maxLength={2000} rows={3} />
          <CheckboxGroup label="Genres" name="genreIds" options={genres.map((g) => ({ value: g.id, label: g.name }))} defaultValue={record?.genres.map((g) => g.genreId)} />
        </Section>
        <Section title="Artwork">
          <ImageInput label="Poster" name="poster" current={record?.posterUrl} aspect="2 / 3" hint="Portrait, e.g. 1000×1500" />
          <ImageInput label="Banner" name="banner" current={record?.bannerUrl} aspect="21 / 9" hint="Wide, e.g. 2520×1080" />
        </Section>
        <Section title="Seasons">
          <SeasonRows name="seasons" defaultValue={(record?.seasons ?? []).map((s) => ({ number: s.number, year: s.year ?? "", episodeCount: s.episodeCount ?? "" }))} />
        </Section>
      </AdminForm>

      {record && (
        <section className={styles.panel} style={{ marginTop: 16 }}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Characters ({record.characters.length})</h2>
            <LinkButton href={`/admin/characters/new?show=${record.id}`} tone="secondary">
              <Plus size={15} aria-hidden /> Character
            </LinkButton>
          </div>
          <table className={styles.table}>
            <tbody>
              {record.characters.length === 0 && (
                <tr>
                  <td className={styles.emptyRow}>No characters yet.</td>
                </tr>
              )}
              {record.characters.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/characters/${c.id}`}>{c.name}</Link>
                  </td>
                  <td className={styles.muted}>{c.actor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
