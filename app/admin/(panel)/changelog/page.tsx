import { Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb } from "@/lib/db";
import { ActionButton, AdminForm, Section, TextArea, TextInput } from "@/components/admin/FormKit";
import { AdminPageHead, DataTable, adminStyles as styles } from "@/components/admin/ui";
import { createChangelogEntry, deleteChangelogEntry } from "../community-actions";

export const metadata = { title: "Changelog" };

export default async function ChangelogAdminPage() {
  await requireAdmin("site.write");
  const rows = await getDb().changelogEntry.findMany({ orderBy: { date: "desc" } });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <AdminPageHead title="Changelog" description="Shown on the What's New page and the homepage. Only list real changes." />
      <AdminForm action={createChangelogEntry} submitLabel="Publish entry">
        <Section title="New entry">
          <TextInput label="Date" name="date" type="date" defaultValue={today} required />
          <TextInput label="Title" name="title" maxLength={120} required placeholder="Request voting" />
          <TextArea label="Changes" name="changes" rows={5} hint="One change per line" placeholder={"Added request voting\nImproved mobile filters"} />
        </Section>
      </AdminForm>
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        empty="No entries yet."
        columns={[
          { header: "Date", cell: (r) => <span className={styles.nowrap}>{r.date.toISOString().slice(0, 10)}</span> },
          { header: "Title", cell: (r) => <strong>{r.title}</strong> },
          { header: "Changes", cell: (r) => <span className={styles.muted}>{r.changes.join(" · ")}</span> },
          {
            header: "",
            cell: (r) => (
              <div className={styles.rowActions}>
                <ActionButton action={deleteChangelogEntry} fields={{ id: r.id }} label="Delete" tone="danger" icon={<Trash2 size={14} aria-hidden />} confirm={`Delete "${r.title}"?`} />
              </div>
            ),
          },
        ]}
      />
    </>
  );
}
