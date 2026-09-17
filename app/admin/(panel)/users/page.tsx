import { requireAdmin } from "@/lib/admin/auth";
import { ADMIN_ROLES, ROLE_LABELS, isAdminRole } from "@/lib/admin/permissions";
import { getDb } from "@/lib/db";
import { ActionButton, AdminForm, Section, SelectInput, TextInput } from "@/components/admin/FormKit";
import { AdminPageHead, DataTable, dateTime, adminStyles as styles } from "@/components/admin/ui";
import { addAdmin, revokeAdmin } from "./actions";
import { RoleSelect } from "./RoleSelect";

export const metadata = { title: "Admins" };

const ROLE_HELP = "Owner: everything · Administrator: all content, requests & reports · Moderator: requests & reports · Uploader: add and edit ScenePacks, shows and characters";

export default async function UsersPage() {
  const me = await requireAdmin("users.manage");
  const admins = (await getDb().user.findMany({ where: { role: { in: [...ADMIN_ROLES] } }, orderBy: [{ role: "asc" }, { email: "asc" }] })).filter((u) => isAdminRole(u.role));

  return (
    <>
      <AdminPageHead title="Admins" description={ROLE_HELP} />
      <AdminForm action={addAdmin} submitLabel="Add admin">
        <Section title="Add an admin" description="Creates their login with a temporary password. Ask them to change it via “Forgot password”.">
          <TextInput label="Email" name="email" type="email" required />
          <SelectInput label="Role" name="role" defaultValue="uploader" options={ADMIN_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} />
          <TextInput label="Temporary password" name="password" type="password" autoComplete="new-password" minLength={12} hint="At least 12 characters" required />
        </Section>
      </AdminForm>
      <DataTable
        rows={admins}
        rowKey={(u) => u.id}
        empty="No admins."
        columns={[
          { header: "Email", cell: (u) => <strong>{u.email}{u.id === me.id && <span className={styles.muted}> (you)</span>}</strong> },
          { header: "Role", cell: (u) => (isAdminRole(u.role) ? <RoleSelect id={u.id} role={u.role} disabled={u.id === me.id} /> : null) },
          { header: "Last sign-in", cell: (u) => <span className={`${styles.muted} ${styles.nowrap}`}>{dateTime(u.lastLoginAt)}</span> },
          {
            header: "",
            cell: (u) =>
              u.id !== me.id && (
                <div className={styles.rowActions}>
                  <ActionButton action={revokeAdmin} fields={{ id: u.id }} label="Remove access" tone="danger" confirm={`Remove admin access for ${u.email}?`} />
                </div>
              ),
          },
        ]}
      />
    </>
  );
}
