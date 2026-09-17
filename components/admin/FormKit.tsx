"use client";

import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Search, Trash2, TriangleAlert, X } from "lucide-react";
import { useToast } from "@/components/feedback/ToastProvider";
import { initialFormState, type FormState } from "@/lib/admin/form-state";
import styles from "./admin.module.css";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const FormErrors = createContext<Record<string, string>>({});

/* ---------- Form ---------- */

export function AdminForm({
  action,
  children,
  submitLabel = "Save",
  secondary,
}: {
  action: Action;
  children: ReactNode;
  submitLabel?: string;
  secondary?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const toast = useToast();
  const lastState = useRef<FormState>(initialFormState);

  useEffect(() => {
    if (state === lastState.current) return;
    lastState.current = state;
    if (state.ok && state.message) toast.show(state.message);
  }, [state, toast]);

  return (
    <form
      className={styles.form}
      noValidate
      // Submitting through a transition (instead of `action=`) stops React from
      // resetting the form, so entered values survive validation errors.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      {state.message && !state.ok && (
        <div className={styles.formError} role="alert">
          <TriangleAlert size={18} aria-hidden /> {state.message}
        </div>
      )}
      {state.duplicates && state.duplicates.length > 0 && (
        <div className={styles.duplicate} role="alert">
          <p>
            <strong>This looks like a duplicate of:</strong>
          </p>
          <ul>
            {state.duplicates.map((d) => (
              <li key={d.id}>
                <Link href={d.href} target="_blank">
                  {d.title}
                </Link>
              </li>
            ))}
          </ul>
          <label className={styles.checkboxRow}>
            <input type="checkbox" name="confirmDuplicate" /> It&rsquo;s not a duplicate — save anyway
          </label>
        </div>
      )}
      <FormErrors.Provider value={state.errors ?? {}}>{children}</FormErrors.Provider>
      <div className={styles.submitBar}>
        {secondary}
        <button type="submit" className={styles.primaryButton} disabled={pending}>
          {pending && <Loader2 size={16} className={styles.spin} aria-hidden />}
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className={styles.section}>
      <legend className={styles.sectionTitle}>{title}</legend>
      {description && <p className={styles.sectionHint}>{description}</p>}
      <div className={styles.sectionGrid}>{children}</div>
    </fieldset>
  );
}

/* ---------- Field wrapper ---------- */

export function Field({
  label,
  name,
  hint,
  wide,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  wide?: boolean;
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => ReactNode;
}) {
  const id = useId();
  const errors = useContext(FormErrors);
  const error = errors[name];
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`${styles.field} ${wide ? styles.wide : ""}`}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {hint && !error && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={styles.fieldError}>
          {error}
        </p>
      )}
    </div>
  );
}

type Common = { label: string; name: string; hint?: string; wide?: boolean };

export function TextInput({ label, name, hint, wide, ...rest }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} name={name} hint={hint} wide={wide}>
      {(a) => <input name={name} className={styles.input} {...a} {...rest} />}
    </Field>
  );
}

export function TextArea({ label, name, hint, wide = true, ...rest }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} name={name} hint={hint} wide={wide}>
      {(a) => <textarea name={name} className={styles.textarea} rows={4} {...a} {...rest} />}
    </Field>
  );
}

export function SelectInput({
  label,
  name,
  hint,
  wide,
  options,
  placeholder,
  ...rest
}: Common & SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <Field label={label} name={name} hint={hint} wide={wide}>
      {(a) => (
        <select name={name} className={styles.select} {...a} {...rest}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function Toggle({ label, name, defaultChecked, hint }: { label: string; name: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <div className={styles.field}>
      <label className={styles.toggle}>
        <input type="checkbox" name={name} defaultChecked={defaultChecked} />
        <span className={styles.toggleTrack} aria-hidden />
        <span>{label}</span>
      </label>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}

/** Known yes/no facts; "Unknown" is stored as null and hidden on the site. */
export function TriState({ label, name, value }: { label: string; name: string; value: boolean | null | undefined }) {
  return (
    <SelectInput
      label={label}
      name={name}
      defaultValue={value === true ? "true" : value === false ? "false" : ""}
      options={[
        { value: "", label: "Unknown" },
        { value: "true", label: "Yes" },
        { value: "false", label: "No" },
      ]}
    />
  );
}

/** datetime-local in the admin's own timezone, submitted as an ISO timestamp. */
export function DateTimeInput({ label, name, defaultValue, hint }: Common & { defaultValue?: string | null }) {
  const toLocal = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const [local, setLocal] = useState<string | null>(null);
  const value = local ?? toLocal(defaultValue);
  const iso = value ? new Date(value).toISOString() : "";
  return (
    <Field label={label} name={name} hint={hint ?? `Your local time (${Intl.DateTimeFormat().resolvedOptions().timeZone})`}>
      {(a) => (
        <>
          <input type="datetime-local" className={styles.input} value={value} onChange={(e) => setLocal(e.target.value)} {...a} suppressHydrationWarning />
          <input type="hidden" name={name} value={iso} suppressHydrationWarning />
        </>
      )}
    </Field>
  );
}

/* ---------- Image ---------- */

export function ImageInput({ label, name, current, hint, aspect = "16 / 9" }: Common & { current?: string | null; aspect?: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const shown = preview ?? (removed ? null : current);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  return (
    <Field label={label} name={name} hint={hint ?? "JPEG, PNG, WebP or AVIF · up to 5 MB"}>
      {(a) => (
        <div className={styles.image}>
          <div className={styles.imagePreview} style={{ aspectRatio: aspect }}>
            {shown ? (
              // eslint-disable-next-line @next/next/no-img-element -- local blob previews can't use next/image
              <img src={shown} alt="" />
            ) : (
              <span className={styles.imageEmpty}>
                <ImagePlus size={22} aria-hidden /> No image
              </span>
            )}
          </div>
          <div className={styles.imageControls}>
            <input
              type="file"
              name={name}
              accept="image/jpeg,image/png,image/webp,image/avif"
              className={styles.fileInput}
              onChange={(e) => {
                const file = e.target.files?.[0];
                setPreview(file ? URL.createObjectURL(file) : null);
                if (file) setRemoved(false);
              }}
              {...a}
            />
            {current && (
              <label className={styles.checkboxRow}>
                <input type="checkbox" name={`${name}__remove`} checked={removed} onChange={(e) => setRemoved(e.target.checked)} /> Remove current
                image
              </label>
            )}
          </div>
        </div>
      )}
    </Field>
  );
}

/* ---------- Multi select ---------- */

export type Option = { value: string; label: string; group?: string };

export function CheckboxGroup({
  label,
  name,
  options,
  defaultValue = [],
  hint,
  filterGroup,
}: Common & { options: Option[]; defaultValue?: string[]; filterGroup?: string | null }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultValue));
  const [query, setQuery] = useState("");
  const errors = useContext(FormErrors);

  const visible = options.filter(
    (o) =>
      (selected.has(o.value) || !filterGroup || o.group === filterGroup) &&
      (!query || o.label.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <fieldset className={`${styles.field} ${styles.wide}`}>
      <legend className={styles.label}>
        {label} {selected.size > 0 && <span className={styles.count}>{selected.size} selected</span>}
      </legend>
      {options.length > 8 && (
        <div className={styles.filter}>
          <Search size={15} aria-hidden />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Filter ${label.toLowerCase()}…`} aria-label={`Filter ${label}`} />
        </div>
      )}
      <div className={styles.checks}>
        {visible.length === 0 && <p className={styles.hint}>{filterGroup ? "Nothing for the selected show yet." : "No options."}</p>}
        {visible.map((o) => (
          <label key={o.value} className={`${styles.check} ${selected.has(o.value) ? styles.checkOn : ""}`}>
            <input
              type="checkbox"
              name={`${name}[]`}
              value={o.value}
              checked={selected.has(o.value)}
              onChange={(e) => {
                const next = new Set(selected);
                if (e.target.checked) next.add(o.value);
                else next.delete(o.value);
                setSelected(next);
              }}
            />
            {o.label}
          </label>
        ))}
      </div>
      {/* Keep selections that are filtered out of view */}
      {[...selected]
        .filter((v) => !visible.some((o) => o.value === v))
        .map((v) => (
          <input key={v} type="hidden" name={`${name}[]`} value={v} />
        ))}
      {hint && <p className={styles.hint}>{hint}</p>}
      {errors[name] && <p className={styles.fieldError}>{errors[name]}</p>}
    </fieldset>
  );
}

/* ---------- Ordered list (playlists, collections) ---------- */

export function OrderedPicker({
  label,
  name,
  options,
  defaultValue = [],
  hint,
}: Common & { options: Option[]; defaultValue?: string[] }) {
  const [items, setItems] = useState<string[]>(defaultValue.filter((v) => options.some((o) => o.value === v)));
  const [adding, setAdding] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const byValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);
  const available = options.filter((o) => !items.includes(o.value));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setItems(next);
  };

  return (
    <fieldset className={`${styles.field} ${styles.wide}`}>
      <legend className={styles.label}>
        {label} <span className={styles.count}>{items.length}</span>
      </legend>
      <ol className={styles.ordered}>
        {items.length === 0 && <li className={styles.hint}>Nothing added yet.</li>}
        {items.map((value, i) => {
          const o = byValue.get(value)!;
          return (
            <li
              key={value}
              className={`${styles.orderedItem} ${dragIndex === i ? styles.dragging : ""}`}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragIndex !== null && dragIndex !== i) {
                  move(dragIndex, i);
                  setDragIndex(i);
                }
              }}
              onDragEnd={() => setDragIndex(null)}
            >
              <input type="hidden" name={`${name}[]`} value={value} />
              <span className={styles.orderIndex}>{i + 1}</span>
              <span className={styles.orderLabel}>
                {o.label}
                {o.group && <span className={styles.orderGroup}>{o.group}</span>}
              </span>
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move ${o.label} up`}>
                <ArrowUp size={15} />
              </button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label={`Move ${o.label} down`}>
                <ArrowDown size={15} />
              </button>
              <button type="button" onClick={() => setItems(items.filter((v) => v !== value))} aria-label={`Remove ${o.label}`}>
                <X size={15} />
              </button>
            </li>
          );
        })}
      </ol>
      <div className={styles.addRow}>
        <select value={adding} onChange={(e) => setAdding(e.target.value)} className={styles.select} aria-label={`Add to ${label}`}>
          <option value="">Add…</option>
          {available.map((o) => (
            <option key={o.value} value={o.value}>
              {o.group ? `${o.group} · ${o.label}` : o.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={!adding}
          onClick={() => {
            setItems([...items, adding]);
            setAdding("");
          }}
        >
          <Plus size={15} aria-hidden /> Add
        </button>
      </div>
      {hint && <p className={styles.hint}>{hint}</p>}
    </fieldset>
  );
}

/* ---------- Repeating rows (show seasons) ---------- */

export type SeasonRow = { number: number | ""; year: number | ""; episodeCount: number | "" };

export function SeasonRows({ name, defaultValue }: { name: string; defaultValue: SeasonRow[] }) {
  const [rows, setRows] = useState<SeasonRow[]>(defaultValue);
  const update = (i: number, key: keyof SeasonRow, value: string) =>
    setRows(rows.map((r, j) => (j === i ? { ...r, [key]: value === "" ? "" : Number(value) } : r)));
  const errors = useContext(FormErrors);

  return (
    <fieldset className={`${styles.field} ${styles.wide}`}>
      <legend className={styles.label}>Seasons</legend>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      <table className={styles.miniTable}>
        <thead>
          <tr>
            <th>Season</th>
            <th>Year</th>
            <th>Episodes</th>
            <th>
              <span className="visually-hidden">Remove</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {(["number", "year", "episodeCount"] as const).map((k) => (
                <td key={k}>
                  <input type="number" min={k === "year" ? 1900 : 0} className={styles.input} value={r[k]} onChange={(e) => update(i, k, e.target.value)} aria-label={`Season ${i + 1} ${k}`} />
                </td>
              ))}
              <td>
                <button type="button" className={styles.iconButton} onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={`Remove season row ${i + 1}`}>
                  <Trash2 size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        className={styles.secondaryButton}
        onClick={() => setRows([...rows, { number: (Math.max(0, ...rows.map((r) => Number(r.number) || 0)) + 1) as number, year: "", episodeCount: "" }])}
      >
        <Plus size={15} aria-hidden /> Add season
      </button>
      {errors[name] && <p className={styles.fieldError}>{errors[name]}</p>}
    </fieldset>
  );
}

/* ---------- Inline action button with confirm ---------- */

export function ActionButton({
  action,
  fields,
  label,
  confirm,
  tone = "secondary",
  icon,
}: {
  action: Action;
  fields: Record<string, string>;
  label: string;
  confirm?: string;
  tone?: "secondary" | "danger" | "primary";
  icon?: ReactNode;
}) {
  const [pending, startAction] = useTransition();
  const toast = useToast();

  const cls = tone === "danger" ? styles.dangerButton : tone === "primary" ? styles.primaryButton : styles.secondaryButton;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (confirm && !window.confirm(confirm)) return;
        const data = new FormData(e.currentTarget);
        startAction(async () => {
          // Toast from the transition itself: the button may unmount when the page refreshes.
          const result = await action(initialFormState, data);
          if (result?.message) toast.show(result.message, result.ok ? "success" : "error");
        });
      }}
      className={styles.inlineForm}
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" className={cls} disabled={pending}>
        {pending ? <Loader2 size={15} className={styles.spin} aria-hidden /> : icon}
        {label}
      </button>
    </form>
  );
}
