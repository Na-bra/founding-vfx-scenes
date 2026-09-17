"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dices, Heart, Menu, Search, X } from "lucide-react";
import { mainNav, siteConfig } from "@/config/site";
import { FoundingMark } from "@/components/icons/BrandIcons";
import { SearchBar } from "@/components/search/SearchBar";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./Navbar.module.css";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
}

/**
 * `socialLinks` is rendered on the server (it reads config) and passed in so
 * this client component stays small.
 */
export function Navbar({ socialLinks }: { socialLinks: ReactNode }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Close overlays when the route changes.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
    setSearchOpen(false);
  }

  useBodyScrollLock(menuOpen || searchOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      const typing = target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !typing)) {
        event.preventDefault();
        setMenuOpen(false);
        setSearchOpen(true);
      } else if (event.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen((open) => {
          if (open) menuButtonRef.current?.focus();
          return false;
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
        <div className={`container ${styles.inner}`}>
          <Link href="/" className={styles.brand} aria-label={`${siteConfig.name} home`}>
            <FoundingMark size={30} />
            <span className={styles.wordmark}>
              FOUNDING<span className="gradient-text">VFX</span>
            </span>
          </Link>

          <nav aria-label="Main" className={styles.desktopNav}>
            <ul>
              {mainNav.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`${styles.navLink} ${active ? styles.active : ""}`}
                      aria-current={active ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={styles.actions}>
            <button type="button" className={styles.searchTrigger} onClick={() => setSearchOpen(true)} aria-label="Search">
              <Search size={17} aria-hidden />
              <span className={styles.searchLabel}>Search</span>
              <kbd className={styles.kbd} aria-hidden>
                /
              </kbd>
            </button>
            <div className={styles.desktopSocial}>{socialLinks}</div>
            <ThemeToggle />
            <button
              ref={menuButtonRef}
              type="button"
              className={styles.menuButton}
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label="Open menu"
            >
              <Menu size={22} aria-hidden />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu — full-screen sheet with its own top bar */}
      {menuOpen && (
        <div id="mobile-menu" className={styles.mobileMenu} role="dialog" aria-modal="true" aria-label="Menu">
          <div className={`container ${styles.mobileTop}`}>
            <Link href="/" className={styles.brand} onClick={() => setMenuOpen(false)}>
              <FoundingMark size={30} />
              <span className={styles.wordmark}>
                FOUNDING<span className="gradient-text">VFX</span>
              </span>
            </Link>
            <div className={styles.actions}>
              <ThemeToggle />
              <button
                type="button"
                className={styles.menuButton}
                onClick={() => {
                  setMenuOpen(false);
                  menuButtonRef.current?.focus();
                }}
                aria-label="Close menu"
                autoFocus
              >
                <X size={22} aria-hidden />
              </button>
            </div>
          </div>
          <div className={styles.mobileInner}>
            <SearchBar variant="page" onNavigate={() => setMenuOpen(false)} />
            <nav aria-label="Mobile">
              <ul className={styles.mobileLinks}>
                {mainNav.map((item, i) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href} style={{ "--i": i } as React.CSSProperties}>
                      <Link
                        href={item.href}
                        className={`${styles.mobileLink} ${active ? styles.active : ""}`}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className={styles.mobileExtras}>
              <Link href="/surprise" prefetch={false} className={styles.surprise} onClick={() => setMenuOpen(false)}>
                <Dices size={18} aria-hidden /> Surprise me
              </Link>
              <Link href="/favorites" className={styles.surprise} onClick={() => setMenuOpen(false)}>
                <Heart size={18} aria-hidden /> Favorites
              </Link>
            </div>
            <div className={styles.mobileFooter}>
              <span className={styles.mobileFooterLabel}>Follow FoundingVFX</span>
              {socialLinks}
            </div>
          </div>
        </div>
      )}

      {/* Search command palette */}
      {searchOpen && (
        <div
          className={styles.searchOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Search"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSearchOpen(false);
          }}
        >
          <div className={styles.searchPanel}>
            <SearchBar variant="overlay" autoFocus onNavigate={() => setSearchOpen(false)} />
            <p className={styles.searchHint}>
              Try <span className="mono">henry danger</span>, <span className="mono">4k wednesday</span> or{" "}
              <span className="mono">60fps</span> · <kbd className={styles.kbd}>Esc</kbd> to close
            </p>
          </div>
        </div>
      )}
    </>
  );
}
