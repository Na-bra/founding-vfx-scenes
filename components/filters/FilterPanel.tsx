"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import type { FacetOption, ScenePackFacets } from "@/lib/data/repository";
import styles from "./FilterPanel.module.css";

type SelectKey = "show" | "character" | "channel" | "genre" | "season" | "year" | "format";
type ChipKey = "resolution" | "fps" | "size" | "tag";

const SELECTS: { key: SelectKey; label: string; facet: keyof ScenePackFacets; any: string }[] = [
  { key: "show", label: "Show", facet: "shows", any: "All shows" },
  { key: "character", label: "Character", facet: "characters", any: "All characters" },
  { key: "channel", label: "Channel", facet: "channels", any: "All channels" },
  { key: "genre", label: "Genre", facet: "genres", any: "All genres" },
  { key: "season", label: "Season", facet: "seasons", any: "Any season" },
  { key: "year", label: "Year", facet: "years", any: "Any year" },
  { key: "format", label: "Format", facet: "formats", any: "Any format" },
];

const CHIPS: { key: ChipKey; label: string; facet: keyof ScenePackFacets }[] = [
  { key: "resolution", label: "Resolution", facet: "resolutions" },
  { key: "fps", label: "Frame rate", facet: "fps" },
  { key: "size", label: "File size", facet: "sizes" },
  { key: "tag", label: "Tags", facet: "tags" },
];

export const FILTER_PARAM_KEYS = [...SELECTS.map((s) => s.key), ...CHIPS.map((c) => c.key)];

export function FilterPanel({ facets }: { facets: ScenePackFacets }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeCount = FILTER_PARAM_KEYS.filter((k) => params.has(k)).length;

  useEffect(() => {
    if (!sheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen]);

  function update(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    next.delete("page");
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  function set(key: string, value: string | null) {
    update((next) => (value ? next.set(key, value) : next.delete(key)));
  }

  function clearAll() {
    update((next) => FILTER_PARAM_KEYS.forEach((k) => next.delete(k)));
  }

  const visibleSelects = SELECTS.filter((s) => facets[s.facet].length > 0);
  const visibleChips = CHIPS.filter((c) => facets[c.facet].length > 0);

  return (
    <>
      <button type="button" className={styles.trigger} onClick={() => setSheetOpen(true)} aria-haspopup="dialog">
        <SlidersHorizontal size={17} aria-hidden />
        Filters
        {activeCount > 0 && <span className={styles.count}>{activeCount}</span>}
      </button>

      <div
        className={`${styles.backdrop} ${sheetOpen ? styles.backdropOpen : ""}`}
        onClick={() => setSheetOpen(false)}
        aria-hidden
      />

      <aside
        className={`${styles.panel} ${sheetOpen ? styles.panelOpen : ""}`}
        aria-label="ScenePack filters"
        role={sheetOpen ? "dialog" : undefined}
        aria-modal={sheetOpen || undefined}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>
            Filters
            {pending && <Loader2 size={15} className={styles.spinner} aria-label="Updating results" />}
          </h2>
          <div className={styles.headerActions}>
            {activeCount > 0 && (
              <button type="button" className={styles.reset} onClick={clearAll}>
                <RotateCcw size={14} aria-hidden /> Clear all
              </button>
            )}
            <button type="button" className={styles.close} onClick={() => setSheetOpen(false)} aria-label="Close filters">
              <X size={18} aria-hidden />
            </button>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.selects}>
            {visibleSelects.map((s) => (
              <label key={s.key} className={styles.field}>
                <span className={styles.label}>{s.label}</span>
                <select
                  value={params.get(s.key) ?? ""}
                  onChange={(e) => set(s.key, e.target.value || null)}
                  className={`${styles.select} ${params.has(s.key) ? styles.selectActive : ""}`}
                >
                  <option value="">{s.any}</option>
                  {facets[s.facet].map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label} ({o.count})
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          {visibleChips.map((c) => (
            <fieldset key={c.key} className={styles.group}>
              <legend className={styles.label}>{c.label}</legend>
              <div className={styles.chips}>
                {facets[c.facet].slice(0, c.key === "tag" ? 14 : undefined).map((o: FacetOption) => {
                  const active = params.get(c.key) === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      className={`${styles.chip} ${active ? styles.chipActive : ""}`}
                      aria-pressed={active}
                      onClick={() => set(c.key, active ? null : o.value)}
                    >
                      {o.label}
                      <span className={styles.chipCount}>{o.count}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <div className={styles.sheetFooter}>
          <button type="button" className={styles.apply} onClick={() => setSheetOpen(false)}>
            {pending ? "Updating…" : "Show results"}
          </button>
        </div>
      </aside>
    </>
  );
}

export function SortSelect({ options }: { options: { value: string; label: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const current = params.get("sort") ?? (params.get("q") ? "" : "newest");

  return (
    <label className={styles.sort}>
      <span className="visually-hidden">Sort by</span>
      <select
        className={styles.select}
        value={current}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          if (e.target.value) next.set("sort", e.target.value);
          else next.delete("sort");
          next.delete("page");
          startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
        }}
      >
        {params.get("q") && <option value="">Best match</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
