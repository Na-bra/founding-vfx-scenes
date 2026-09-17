import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabasePublicConfig } from "@/lib/supabase/config";
import { can, isAdminRole, type AdminRole, type Permission } from "./permissions";

export type AdminUser = { id: string; email: string; role: AdminRole; authUserId: string };

/**
 * The signed-in admin for this request, or null. `auth.getUser()` validates
 * the session with Supabase (not just the cookie), then the role is read from
 * our database — a Supabase account alone grants nothing.
 */
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  if (!supabasePublicConfig()) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const row = await getDb().user.findUnique({ where: { authUserId: user.id } });
  if (!row || !isAdminRole(row.role)) return null;
  return { id: row.id, email: row.email, role: row.role, authUserId: user.id };
});

/** For admin pages: redirects to login when signed out, or to the dashboard when not permitted. */
export async function requireAdmin(permission?: Permission): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (permission && !can(admin.role, permission)) redirect("/admin?denied=1");
  return admin;
}

export class ForbiddenError extends Error {
  constructor() {
    super("You don't have permission to do that.");
  }
}

/** For server actions: throws instead of redirecting so the form can show the error. */
export async function authorize(permission: Permission): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin || !can(admin.role, permission)) throw new ForbiddenError();
  return admin;
}
