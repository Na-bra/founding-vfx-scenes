"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import styles from "./ThemeToggle.module.css";

type Theme = "light" | "dark";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // Follow the OS preference until the visitor picks a theme explicitly.
  const media = window.matchMedia("(prefers-color-scheme: light)");
  const onSystemChange = () => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {}
    if (stored !== "light" && stored !== "dark") applyTheme(media.matches ? "light" : "dark", false);
  };
  media.addEventListener("change", onSystemChange);

  return () => {
    observer.disconnect();
    media.removeEventListener("change", onSystemChange);
  };
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function applyTheme(theme: Theme, persist: boolean) {
  const root = document.documentElement;
  root.classList.add("theme-transition");
  root.setAttribute("data-theme", theme);
  window.setTimeout(() => root.classList.remove("theme-transition"), 500);
  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}
  }
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "dark" as Theme);
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className={[styles.toggle, className].filter(Boolean).join(" ")}
      onClick={() => applyTheme(next, true)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      data-theme-state={theme}
    >
      <Sun size={18} className={styles.sun} aria-hidden />
      <Moon size={18} className={styles.moon} aria-hidden />
    </button>
  );
}
