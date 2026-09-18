import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { can } from "@/lib/admin/permissions";
import { getDb } from "@/lib/db";
import { ActionButton, AdminForm, CheckboxGroup, ImageInput, SeasonRows, Section, SelectInput, TextArea, TextInput, Toggle } from "@/components/admin/FormKit";
import { AdminPageHead, LinkButton, adminStyles as styles } from "@/components/admin/ui";
import { deleteShow, saveShow } from "../catalog-actions";
import { getTmdbDetails, isTmdbConfigured, type TmdbShowDetails } from "@/services/metadata/tmdb";
import { CastImport } from "./CastImport";
import { TmdbSearch } from "./TmdbSearch";
import { normalize } from "@/lib/search/text";

export async function ShowEditor({ id, tmdb }: { id: string | null; tmdb?: { id: number; type: "tv" | "movie" } }) {
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

  // Prefill a new show from TMDB, or load its cast when the show is linked.
  let imported: TmdbShowDetails | null = null;
  let importError: string | null = null;
  const source = tmdb ?? (record?.tmdbId && record.tmdbType ? { id: record.tmdbId, type: record.tmdbType as "tv" | "movie" } : null);
  if (source && isTmdbConfigured()) {
    try {
      imported = await getTmdbDetails(source.id, source.type);
    } catch (error) {
      console.error("[admin] TMDB details failed", error);
      importError = "Couldn't load details from TMDB. Fill the form in manually or try again.";
    }
  }

  const prefill = tmdb && imported ? imported : null;
  const byName = <T extends { id: string; name: string }>(items: T[], name: string) => items.find((x) => normalize(x.name) === normalize(name));
  const matchedGenres = prefill ? prefill.genres.map((g) => byName(genres, g)).filter((g) => g !== undefined) : [];
  const missingGenres = prefill ? prefill.genres.filter((g) => !byName(genres, g)) : [];
  const matchedChannel = prefill?.network ? byName(channels, prefill.network) : undefined;
  const missingChannel = prefill?.network && !matchedChannel ? prefill.network : null;
  const values = {
    title: prefill?.title ?? record?.title ?? "",
    aliases: (prefill?.aliases ?? record?.aliases ?? []).join(", "),
    format: prefill ? (prefill.mediaType === "movie" ? "film" : "series") : (record?.format ?? "series"),
    description: prefill?.description ?? record?.description ?? "",
    yearStart: prefill?.yearStart ?? record?.yearStart ?? "",
    yearEnd: (prefill ? prefill.yearEnd : record?.yearEnd) ?? "",
    channelId: matchedChannel?.id ?? record?.channelId ?? "",
    genreIds: prefill ? matchedGenres.map((g) => g.id) : record?.genres.map((g) => g.genreId),
    seasons: prefill
      ? prefill.seasons.map((s) => ({ number: s.number, year: s.year ?? ("" as const), episodeCount: s.episodeCount ?? ("" as const) }))
      : (record?.seasons ?? []).map((s) => ({ number: s.number, year: s.year ?? ("" as const), episodeCount: s.episodeCount ?? ("" as const) })),
  };

  const castOptions = imported && record
    ? imported.cast.map((c) => ({
        name: c.name,
        actor: c.actor,
        profileUrl: c.profileUrl,
        exists: record.characters.some((x) => normalize(x.name) === normalize(c.name)),
      }))
    : [];

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
      {!record && !prefill && (
        <TmdbSearch configured={isTmdbConfigured()} />
      )}
      {importError && <p className={styles.notice}>{importError}</p>}
      {prefill && (
        <p className={styles.prefilled}>
          <Sparkles size={18} aria-hidden /> Prefilled from TMDB — check the details, then create the show.
        </p>
      )}

      {/* Remount when the imported show changes: selects, season rows and genre
          checkboxes hold their own state and would otherwise keep old values. */}
      <AdminForm
        key={prefill ? `tmdb-${prefill.id}` : (record?.id ?? "new")}
        action={saveShow.bind(null, id)}
        submitLabel={record ? "Save changes" : "Create show"}
      >
        {(prefill || record?.tmdbId) && (
          <>
            <input type="hidden" name="tmdbId" value={prefill?.id ?? record?.tmdbId ?? ""} />
            <input type="hidden" name="tmdbType" value={prefill?.mediaType ?? record?.tmdbType ?? ""} />
          </>
        )}
        {prefill && (
          <>
            <input type="hidden" name="tmdbPosterUrl" value={prefill.posterUrl ?? ""} />
            <input type="hidden" name="tmdbBannerUrl" value={prefill.bannerUrl ?? ""} />
            {missingChannel && <input type="hidden" name="newChannelName" value={missingChannel} />}
            {missingGenres.length > 0 && <input type="hidden" name="newGenreNames" value={missingGenres.join(", ")} />}
          </>
        )}
        <Section title="Details">
          <TextInput label="Title" name="title" defaultValue={values.title} required maxLength={160} />
          <TextInput label="Slug" name="slug" defaultValue={record?.slug} hint="Leave blank to generate from the title" />
          <SelectInput
            label="Format"
            name="format"
            defaultValue={values.format}
            options={[
              { value: "series", label: "Series" },
              { value: "film", label: "Film" },
              { value: "special", label: "Special" },
            ]}
          />
          <SelectInput label="Channel" name="channelId" defaultValue={values.channelId} placeholder="Choose a channel…" options={channels.map((c) => ({ value: c.id, label: c.name }))} />
          <TextInput label="First year" name="yearStart" type="number" min={1900} max={2100} defaultValue={values.yearStart} required />
          <TextInput label="Last year" name="yearEnd" type="number" min={1900} max={2100} defaultValue={values.yearEnd} hint="Blank if still running" />
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
          <TextInput label="Also known as" name="aliases" defaultValue={values.aliases} hint="Comma-separated. Used by search." wide />
          <TextArea label="Description" name="description" defaultValue={values.description} maxLength={2000} rows={3} />
          <CheckboxGroup
            label="Genres"
            name="genreIds"
            options={genres.map((g) => ({ value: g.id, label: g.name }))}
            defaultValue={values.genreIds}
          />
          {(missingChannel || missingGenres.length > 0) && (
            <Toggle
              label={`Also create from TMDB: ${[missingChannel, ...missingGenres].filter(Boolean).join(", ")}`}
              name="createMissing"
              defaultChecked
              hint="Adds the channel/genres we don't have yet"
            />
          )}
        </Section>
        <Section title="Artwork">
          <ImageInput
            label="Poster"
            name="poster"
            current={record?.posterUrl ?? prefill?.posterUrl}
            aspect="2 / 3"
            hint={prefill?.posterUrl ? "From TMDB — saved to your storage. Upload a file to replace it." : "Portrait, e.g. 1000×1500"}
          />
          <ImageInput
            label="Banner"
            name="banner"
            current={record?.bannerUrl ?? prefill?.bannerUrl}
            aspect="21 / 9"
            hint={prefill?.bannerUrl ? "From TMDB — saved to your storage. Upload a file to replace it." : "Wide, e.g. 2520×1080"}
          />
        </Section>
        <Section title="Seasons">
          <SeasonRows name="seasons" defaultValue={values.seasons} />
        </Section>
      </AdminForm>

      {record && castOptions.length > 0 && (
        <section className={styles.panel} style={{ marginTop: 16 }}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Import cast from TMDB</h2>
          </div>
          <div style={{ padding: 16 }}>
            <CastImport showId={record.id} cast={castOptions} />
          </div>
        </section>
      )}

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
