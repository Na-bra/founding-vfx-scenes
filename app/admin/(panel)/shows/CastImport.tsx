"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { useToast } from "@/components/feedback/ToastProvider";
import { initialFormState } from "@/lib/admin/form-state";
import styles from "@/components/admin/admin.module.css";
import { importCast } from "./tmdb-actions";

export type CastOption = { name: string; actor: string; profileUrl: string | null; exists: boolean };

/** Pick which TMDB cast members to create as characters. */
export function CastImport({ showId, cast }: { showId: string; cast: CastOption[] }) {
  const [state, action, pending] = useActionState(importCast.bind(null, showId), initialFormState);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toast = useToast();
  const available = cast.filter((c) => !c.exists);
  const last = useRef(state);

  useEffect(() => {
    if (state === last.current) return;
    last.current = state;
    if (state.ok && state.message) toast.show(state.message);
  }, [state, toast]);

  if (available.length === 0) return <p className={styles.hint}>Every TMDB cast member already exists as a character.</p>;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setSelected(new Set());
        startTransition(() => action(data));
      }}
    >
      {state.message && !state.ok && <p className={styles.fieldError}>{state.message}</p>}
      <div className={styles.checks} style={{ maxHeight: 260 }}>
        {available.map((c) => {
          const value = `${c.name}|${c.actor}`;
          const on = selected.has(value);
          return (
            <label key={value} className={`${styles.check} ${on ? styles.checkOn : ""}`}>
              <input
                type="checkbox"
                name="cast"
                value={value}
                checked={on}
                onChange={(e) => {
                  const next = new Set(selected);
                  if (e.target.checked) next.add(value);
                  else next.delete(value);
                  setSelected(next);
                }}
              />
              {c.name} <span className={styles.muted}>· {c.actor}</span>
            </label>
          );
        })}
      </div>
      <div className={styles.addRow}>
        <button type="submit" className={styles.secondaryButton} disabled={pending || selected.size === 0}>
          {pending ? <Loader2 size={15} className={styles.spin} aria-hidden /> : <UserPlus size={15} aria-hidden />}
          Add {selected.size > 0 ? selected.size : ""} character{selected.size === 1 ? "" : "s"}
        </button>
      </div>
    </form>
  );
}
