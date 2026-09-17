"use client";

import { startTransition, useState } from "react";
import { useToast } from "@/components/feedback/ToastProvider";
import { initialFormState } from "@/lib/admin/form-state";
import { ADMIN_ROLES, ROLE_LABELS, type AdminRole } from "@/lib/admin/permissions";
import styles from "@/components/admin/admin.module.css";
import { changeAdminRole } from "./actions";

export function RoleSelect({ id, role, disabled }: { id: string; role: AdminRole; disabled?: boolean }) {
  const [value, setValue] = useState(role);
  const toast = useToast();
  return (
    <select
      className={styles.select}
      value={value}
      disabled={disabled}
      aria-label="Role"
      onChange={(e) => {
        const next = e.target.value as AdminRole;
        const fd = new FormData();
        fd.set("id", id);
        fd.set("role", next);
        setValue(next);
        startTransition(async () => {
          const result = await changeAdminRole(initialFormState, fd);
          if (!result.ok) setValue(role);
          if (result.message) toast.show(result.message, result.ok ? "success" : "error");
        });
      }}
    >
      {ADMIN_ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABELS[r]}
        </option>
      ))}
    </select>
  );
}
