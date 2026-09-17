import Link from "next/link";
import { legalNav, mainNav, siteConfig } from "@/config/site";
import { FoundingMark } from "@/components/icons/BrandIcons";
import { SocialLinks } from "./SocialLinks";
import styles from "./Footer.module.css";

export function Footer() {
  const year = new Date().getUTCFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.glow} aria-hidden />
      <div className={`container ${styles.grid}`}>
        <div className={styles.brandCol}>
          <Link href="/" className={styles.brand}>
            <FoundingMark size={34} />
            <span>
              FOUNDING<span className="gradient-text">VFX</span>
            </span>
          </Link>
          <p className={styles.description}>{siteConfig.description}</p>
          <SocialLinks variant="icons" />
        </div>

        <nav aria-label="Footer" className={styles.col}>
          <h2 className={styles.heading}>Explore</h2>
          <ul>
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Discover" className={styles.col}>
          <h2 className={styles.heading}>Discover</h2>
          <ul>
            <li>
              <Link href="/characters">Characters</Link>
            </li>
            <li>
              <Link href="/collections">Collections</Link>
            </li>
            <li>
              <Link href="/search">Search</Link>
            </li>
            <li>
              <Link href="/favorites">My favorites</Link>
            </li>
            <li>
              <Link href="/surprise" prefetch={false}>
                Surprise me
              </Link>
            </li>
            <li>
              <Link href="/changelog">What&rsquo;s new</Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Legal" className={styles.col}>
          <h2 className={styles.heading}>Legal</h2>
          <ul>
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className={`container ${styles.bottom}`}>
        <p>
          © {year} {siteConfig.name}. All rights reserved.
        </p>
        <p className={styles.notice}>
          FoundingVFX only distributes content it is authorized to share. Trademarks belong to their respective owners.
        </p>
      </div>
    </footer>
  );
}
