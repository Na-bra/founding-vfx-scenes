import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";
import { resolutionFromDb } from "@/lib/data/prisma/mappers";
import { ActionButton, AdminForm, Section, SelectInput, TextArea, TextInput, Toggle } from "@/components/admin/FormKit";
import { AdminPageHead, LinkButton, dateTime } from "@/components/admin/ui";
import { deleteRequest, saveRequest } from "../../community-actions";

export const metadata = { title: "Request" };

export default async function RequestAdminPage({ params }: PageProps<"/admin/requests/[id]">) {
  await requireAdmin("community.moderate");
  const { id } = await params;
  const db = getDb();
  const [r, shows, channels, genres, packs] = await Promise.all([
    db.sceneRequest.findUnique({ where: { id } }),
    db.show.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    db.channel.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.genre.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.scenePack.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);
  if (!r) notFound();

  return (
    <>
      <AdminPageHead
        title={r.title}
        description={`${r.voteCount} votes · requested ${dateTime(r.createdAt)}`}
        crumbs={[{ label: "Requests", href: "/admin/requests" }]}
        actions={
          <>
            <LinkButton href={`/admin/scenepacks/new${r.showId ? `?show=${r.showId}` : ""}`} tone="secondary">
              Create ScenePack
            </LinkButton>
            <LinkButton href={`/requests/${r.id}`} tone="secondary">
              View on site
            </LinkButton>
            <ActionButton action={deleteRequest} fields={{ id: r.id }} label="Delete" tone="danger" icon={<Trash2 size={15} aria-hidden />} confirm="Delete this request and its votes?" />
          </>
        }
      />
      <AdminForm action={saveRequest.bind(null, r.id)} submitLabel="Save changes">
        <Section title="Status">
          <SelectInput
            label="Status"
            name="status"
            defaultValue={r.status}
            options={[
              { value: "pending", label: "Pending" },
              { value: "under_review", label: "Under review" },
              { value: "planned", label: "Planned" },
              { value: "in_progress", label: "In progress" },
              { value: "completed", label: "Completed" },
              { value: "published", label: "Published" },
              { value: "declined", label: "Declined" },
            ]}
          />
          <SelectInput
            label="Fulfilled by"
            name="fulfilledByScenePackId"
            defaultValue={r.fulfilledByScenePackId ?? ""}
            placeholder="Not yet"
            options={packs.map((p) => ({ value: p.id, label: p.title }))}
            hint="Links the request to its ScenePack on the site"
          />
          <Toggle label="High priority" name="highPriority" defaultChecked={r.highPriority} />
        </Section>
        <Section title="What was requested">
          <TextInput label="Title" name="title" defaultValue={r.title} required maxLength={160} />
          <TextInput label="Show / movie (as typed)" name="showTitle" defaultValue={r.showTitle} required maxLength={160} />
          <SelectInput label="Linked show" name="showId" defaultValue={r.showId ?? ""} placeholder="Not linked" options={shows.map((s) => ({ value: s.id, label: s.title }))} />
          <TextInput label="Character" name="characterName" defaultValue={r.characterName ?? ""} maxLength={120} />
          <SelectInput label="Channel" name="channelId" defaultValue={r.channelId ?? ""} placeholder="—" options={channels.map((c) => ({ value: c.id, label: c.name }))} />
          <SelectInput label="Genre" name="genreId" defaultValue={r.genreId ?? ""} placeholder="—" options={genres.map((g) => ({ value: g.id, label: g.name }))} />
          <TextInput label="Year" name="year" type="number" defaultValue={r.year ?? ""} />
          <TextInput label="Season" name="season" type="number" defaultValue={r.season ?? ""} />
          <TextInput label="Episode" name="episode" type="number" defaultValue={r.episode ?? ""} />
          <SelectInput
            label="Preferred resolution"
            name="preferredResolution"
            defaultValue={r.preferredResolution ? resolutionFromDb(r.preferredResolution) : ""}
            placeholder="Any"
            options={["720p", "1080p", "1440p", "4K"].map((v) => ({ value: v, label: v }))}
          />
          <TextInput label="Preferred FPS" name="preferredFps" type="number" defaultValue={r.preferredFps ?? ""} />
          <TextArea label="Description" name="description" defaultValue={r.description} maxLength={2000} rows={3} />
        </Section>
      </AdminForm>
    </>
  );
}
