import { AdminForm, TextInput } from "@/components/admin/FormKit";
import { updatePassword } from "../../auth-actions";
import { AuthCard } from "../AuthCard";

export const metadata = { title: "Set new password" };

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Set a new password">
      <AdminForm action={updatePassword} submitLabel="Update password">
        <TextInput label="New password" name="password" type="password" autoComplete="new-password" minLength={12} hint="At least 12 characters" required />
        <TextInput label="Confirm password" name="confirm" type="password" autoComplete="new-password" required />
      </AdminForm>
    </AuthCard>
  );
}
