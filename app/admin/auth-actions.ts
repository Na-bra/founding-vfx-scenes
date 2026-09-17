"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/admin/permissions";
import type { FormState } from "@/lib/admin/form-state";
import { rateLimit } from "@/lib/server/rate-limit";
import { createHash } from "node:crypto";

async function clientKey(scope: string, extra = "") {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const salt = process.env.RATE_LIMIT_SALT ?? "dev-only-salt";
  return `${scope}:${createHash("sha256").update(`${salt}:${ip}:${extra}`).digest("hex").slice(0, 32)}`;
}

function safeNext(next: unknown) {
  return typeof next === "string" && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password").max(200),
});

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { message: parsed.error.issues[0].message };

  const byIp = rateLimit(await clientKey("admin-login"), 10, 15 * 60_000);
  const byAccount = rateLimit(await clientKey("admin-login-account", parsed.data.email), 5, 15 * 60_000);
  if (!byIp.ok || !byAccount.ok) return { message: "Too many attempts. Try again in 15 minutes." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  // Same message for unknown email and wrong password.
  if (error || !data.user) return { message: "Incorrect email or password." };

  const db = getDb();
  const row = await db.user.findUnique({ where: { authUserId: data.user.id } });
  if (!row || !isAdminRole(row.role)) {
    await supabase.auth.signOut();
    return { message: "This account doesn't have admin access." };
  }
  await db.user.update({ where: { id: row.id }, data: { lastLoginAt: new Date() } });

  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  if (!email.success) return { message: "Enter a valid email." };

  const limited = rateLimit(await clientKey("admin-reset"), 3, 15 * 60_000);
  if (!limited.ok) return { message: "Too many requests. Try again later." };

  const h = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${origin}/admin/auth/confirm?next=/admin/reset-password`,
  });
  if (error) console.warn("[admin] password reset request failed", error.message);

  // Never reveal whether the email exists.
  return { ok: true, message: "If that email has an admin account, a reset link is on its way." };
}

export async function updatePassword(_: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 12) return { message: "Use at least 12 characters.", errors: { password: "At least 12 characters" } };
  if (password !== confirm) return { message: "Passwords don't match.", errors: { confirm: "Doesn't match" } };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { message: error.message.includes("session") ? "Your reset link expired. Request a new one." : "Couldn't update the password." };
  redirect("/admin");
}
