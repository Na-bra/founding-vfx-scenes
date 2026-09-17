import Link from "next/link";
import { AdminForm, TextInput } from "@/components/admin/FormKit";
import styles from "@/components/admin/admin.module.css";
import { requestPasswordReset } from "../../auth-actions";
import { AuthCard } from "../AuthCard";

export const metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Reset password">
      <p className={styles.hint}>We&rsquo;ll email you a link to set a new password.</p>
      <AdminForm action={requestPasswordReset} submitLabel="Send reset link">
        <TextInput label="Email" name="email" type="email" autoComplete="username" required />
      </AdminForm>
      <div className={styles.authLinks}>
        <Link href="/admin/login">← Back to sign in</Link>
      </div>
    </AuthCard>
  );
}
