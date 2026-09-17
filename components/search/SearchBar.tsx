"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Clapperboard, Hash, Layers, LibraryBig, ListVideo, Loader2, Search, Shapes, Tv, User, X } from "lucide-react";
import type { SearchSuggestion, SuggestionType } from "@/lib/data/repository";
import styles from "./SearchBar.module.css";

const TYPE_ICONS: Record<SuggestionType, typeof Search> = {
  scenepack: Clapperboard,
  show: Tv,
  character: User,
  channel: Layers,
  genre: Shapes,
  playlist: ListVideo,
  collection: LibraryBig,
  tag: Hash,
};

type Props = {
  variant?: "hero" | "overlay" | "page";
  defaultValue?: string;
  autoFocus?: boolean;
  placeholder?: string;
  onNavigate?: () => void;
};

export function SearchBar({
  variant = "page",
  defaultValue = "",
  autoFocus,
  placeholder = "Search shows, characters, ScenePacks...",
  onNavigate,
}: Props) {
  const router = useRouter();
  const id = useId();
  const listId = `${id}-list`;
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length === 0) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { suggestions: SearchSuggestion[] };
        setSuggestions(data.suggestions);
        setActive(-1);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 140);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const visible = open && query.trim().length > 0;
  const shown = query.trim().length > 0 ? suggestions : [];

  function go(href: string) {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (visible && active >= 0 && shown[active]) return go(shown[active].href);
    const q = query.trim();
    go(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    // "See all results" is the extra final option.
    const count = shown.length + 1;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % count);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i <= 0 ? count - 1 : i - 1));
    } else if (event.key === "Escape") {
      if (visible) {
        event.stopPropagation();
        setOpen(false);
      }
    }
  }

  const seeAllIndex = shown.length;

  return (
    <form
      role="search"
      className={`${styles.form} ${styles[variant]}`}
      onSubmit={submit}
    >
      <div className={styles.field}>
        <Search className={styles.icon} size={variant === "hero" ? 22 : 18} aria-hidden />
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          className={styles.input}
          role="combobox"
          aria-label="Search FoundingVFX"
          aria-expanded={visible}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={visible && active >= 0 ? `${id}-opt-${active}` : undefined}
        />
        {loading && <Loader2 className={styles.spinner} size={16} aria-hidden />}
        {query && (
          <button
            type="button"
            className={styles.clear}
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            <X size={16} aria-hidden />
          </button>
        )}
        {variant === "hero" && (
          <button type="submit" className={styles.submit}>
            Search
          </button>
        )}
      </div>

      <ul id={listId} role="listbox" className={styles.list} hidden={!visible} aria-label="Search suggestions">
        {shown.map((s, i) => {
          const Icon = TYPE_ICONS[s.type];
          return (
            <li
              key={`${s.type}-${s.href}`}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={active === i}
              className={styles.option}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(s.href)}
              onMouseEnter={() => setActive(i)}
            >
              <span className={styles.optionIcon}>
                <Icon size={16} aria-hidden />
              </span>
              <span className={styles.optionText}>
                <span className={styles.optionLabel}>{s.label}</span>
                {s.sublabel && <span className={styles.optionSub}>{s.sublabel}</span>}
              </span>
            </li>
          );
        })}
        {!loading && shown.length === 0 && (
          <li className={styles.noResults} role="presentation">
            No quick matches — press Enter to search everything.
          </li>
        )}
        <li
          id={`${id}-opt-${seeAllIndex}`}
          role="option"
          aria-selected={active === seeAllIndex}
          className={`${styles.option} ${styles.seeAll}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => go(`/search?q=${encodeURIComponent(query.trim())}`)}
          onMouseEnter={() => setActive(seeAllIndex)}
        >
          <span className={styles.optionText}>
            <span className={styles.optionLabel}>See all results for “{query.trim()}”</span>
          </span>
          <ArrowUpRight size={16} aria-hidden />
        </li>
      </ul>
    </form>
  );
}
