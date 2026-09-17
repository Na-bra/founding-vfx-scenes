"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { authorize } from "@/lib/admin/auth";
import { audit } from "@/lib/admin/audit";
import { actionError, parseForm } from "@/lib/admin/forms";
import type { FormState } from "@/lib/admin/form-state";
import { ADMIN_ROLES, ROLE_LABELS } from "@/lib/admin/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { refresh } from "next/cache";

const addSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  role: z.enum(ADMIN_ROLES),
  password: z.string().min(12, "At least 12 characters").max(200),
});

async function findAuthUserId(email: string) {
  const supabase = createSupabaseAdminClient();
  for (let page = 1; page < 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

export async function addAdmin(_: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("users.manage");
    const parsed = parseForm(addSchema, formData);
    if (!parsed.ok) return parsed.state;
    const { email, role, password } = parsed.data;

    let authUserId = await findAuthUserId(email);
    let created = false;
    if (!authUserId) {
      const { data, error } = await createSupabaseAdminClient().auth.admin.createUser({ email, password, email_confirm: true });
      if (error) return { message: error.message };
      authUserId = data.user.id;
      created = true;
    }

    const username = `${email.split("@")[0].replace(/[^a-z0-9_]/g, "").slice(0, 20) || "admin"}_${randomBytes(3).toString("hex")}`;
    const user = await getDb().user.upsert({ where: { email }, update: { authUserId, role }, create: { email, username, authUserId, role } });
    await audit(admin, "admin.add", { type: "user", id: user.id, label: email }, { role: { to: role } });
    refresh();
    return {
      ok: true,
      message: created
        ? `${email} added as ${ROLE_LABELS[role]}. Share the temporary password securely.`
        : `${email} already had an account — granted ${ROLE_LABELS[role]} (their existing password is unchanged).`,
    };
  } catch (error) {
    return actionError(error, "admin");
  }
}

async function guardOwnerChange(targetId: string, actorId: string, nextRole: string) {
  if (targetId === actorId) return "You can't change your own access.";
  const db = getDb();
  const target = await db.user.findUnique({ where: { id: targetId } });
  if (!target) return "This user no longer exists.";
  if (target.role === "owner" && nextRole !== "owner" && (await db.user.count({ where: { role: "owner" } })) <= 1) {
    return "There must always be at least one owner.";
  }
  return null;
}

export async function changeAdminRole(_: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("users.manage");
    const id = String(formData.get("id"));
    const role = z.enum(ADMIN_ROLES).parse(formData.get("role"));
    const problem = await guardOwnerChange(id, admin.id, role);
    if (problem) return { message: problem };
    const before = await getDb().user.findUniqueOrThrow({ where: { id } });
    await getDb().user.update({ where: { id }, data: { role } });
    await audit(admin, "admin.role", { type: "user", id, label: before.email }, { role: { from: before.role, to: role } });
    refresh();
    return { ok: true, message: `${before.email} is now ${ROLE_LABELS[role]}.` };
  } catch (error) {
    return actionError(error, "admin");
  }
}

export async function revokeAdmin(_: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("users.manage");
    const id = String(formData.get("id"));
    const problem = await guardOwnerChange(id, admin.id, "member");
    if (problem) return { message: problem };
    const before = await getDb().user.update({ where: { id }, data: { role: "member" } });
    await audit(admin, "admin.revoke", { type: "user", id, label: before.email });
    refresh();
    return { ok: true, message: `Removed admin access for ${before.email}.` };
  } catch (error) {
    return actionError(error, "admin");
  }
}
