import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin/auth";
import { supabasePublicConfig } from "@/lib/supabase/config";
import { AdminForm, TextInput } from "@/components/admin/FormKit";
import styles from "@/components/admin/admin.module.css";
import { login } from "../../auth-actions";
import { AuthCard } from "../AuthCard";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const sp = await searchParams;
  if (!supabasePublicConfig()) {
    return (
      <AuthCard title="Admin isn't configured">
        <p className={styles.hint}>Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart.</p>
      </AuthCard>
    );
  }
  if (await getAdmin()) redirect("/admin");
  const next = typeof sp.next === "string" ? sp.next : "";

  return (
    <AuthCard title="Sign in">
      {sp.error === "link" && <p className={styles.formError}>That link is invalid or has expired.</p>}
      <AdminForm action={login} submitLabel="Sign in">
        <input type="hidden" name="next" value={next} />
        <TextInput label="Email" name="email" type="email" autoComplete="username" required autoFocus />
        <TextInput label="Password" name="password" type="password" autoComplete="current-password" required />
      </AdminForm>
      <div className={styles.authLinks}>
        <Link href="/">← Back to site</Link>
        <Link href="/admin/forgot-password">Forgot password?</Link>
      </div>
    </AuthCard>
  );
}
