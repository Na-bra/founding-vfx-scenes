import { Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";
import { ActionButton, AdminForm, DateTimeInput, Section, SelectInput, TextInput, Toggle } from "@/components/admin/FormKit";
import { AdminPageHead, DataTable, Pill, dateTime, adminStyles as styles } from "@/components/admin/ui";
import { createAnnouncement, deleteAnnouncement, toggleAnnouncement } from "../community-actions";

export const metadata = { title: "Announcements" };

export default async function AnnouncementsPage() {
  await requireAdmin("site.write");
  const rows = await getDb().announcement.findMany({ orderBy: { createdAt: "desc" } });
  const now = new Date();

  return (
    <>
      <AdminPageHead title="Announcements" description="The banner at the top of every page. The newest active one is shown." />
      <AdminForm action={createAnnouncement} submitLabel="Add announcement">
        <Section title="New announcement">
          <TextInput label="Message" name="message" maxLength={240} required wide placeholder="New ScenePacks have been added." />
          <TextInput label="Link" name="href" hint="Optional — /requests or https://…" />
          <SelectInput label="Style" name="tone" defaultValue="info" options={[{ value: "info", label: "Info" }, { value: "success", label: "Success" }, { value: "warning", label: "Warning" }]} />
          <Toggle label="Active" name="active" defaultChecked />
          <DateTimeInput label="Show from" name="startsAt" hint="Optional" />
          <DateTimeInput label="Hide after" name="endsAt" hint="Optional" />
        </Section>
      </AdminForm>
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        empty="No announcements."
        columns={[
          { header: "Message", cell: (r) => <span>{r.message}{r.href && <><br /><span className={styles.muted}>{r.href}</span></>}</span> },
          {
            header: "State",
            cell: (r) => {
              const live = r.active && (!r.startsAt || r.startsAt <= now) && (!r.endsAt || r.endsAt > now);
              return <Pill value={live ? "published" : r.active ? "scheduled" : "unpublished"} label={live ? "Live" : r.active ? (r.endsAt && r.endsAt <= now ? "Ended" : "Scheduled") : "Hidden"} />;
            },
          },
          { header: "Window", cell: (r) => <span className={styles.muted}>{r.startsAt || r.endsAt ? `${dateTime(r.startsAt)} → ${dateTime(r.endsAt)}` : "Always"}</span> },
          {
            header: "",
            cell: (r) => (
              <div className={styles.rowActions}>
                <ActionButton action={toggleAnnouncement} fields={{ id: r.id, active: String(!r.active) }} label={r.active ? "Hide" : "Show"} />
                <ActionButton action={deleteAnnouncement} fields={{ id: r.id }} label="Delete" tone="danger" icon={<Trash2 size={14} aria-hidden />} confirm="Delete this announcement?" />
              </div>
            ),
          },
        ]}
      />
    </>
  );
}
