"use client";

import { useSyncExternalStore } from "react";

/**
 * Device-local favorites. Visitors can save ScenePacks without an account;
 * once accounts ship (Phase 8) these ids can be offered for import.
 */

const KEY = "fvx-favorites";
const EVENT = "fvx-favorites-change";
const EMPTY: string[] = [];

let cachedRaw: string | null = null;
let cachedValue: string[] = EMPTY;

function read(): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cachedValue = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, 500) : EMPTY;
  } catch {
    cachedValue = EMPTY;
  }
  return cachedValue;
}

function write(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && onChange();
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    ids,
    has: (id: string) => ids.includes(id),
    toggle(id: string): boolean {
      const current = read();
      const exists = current.includes(id);
      write(exists ? current.filter((x) => x !== id) : [id, ...current]);
      return !exists;
    },
    clear: () => write([]),
  };
}
