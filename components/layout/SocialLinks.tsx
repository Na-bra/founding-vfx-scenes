import { siteConfig, type SocialLink } from "@/config/site";
import { DiscordIcon, TikTokIcon, YouTubeIcon } from "@/components/icons/BrandIcons";
import styles from "./SocialLinks.module.css";

const ICONS: Record<SocialLink["id"], typeof YouTubeIcon> = {
  youtube: YouTubeIcon,
  tiktok: TikTokIcon,
  discord: DiscordIcon,
};

type Props = {
  variant?: "icons" | "labeled" | "cards";
  only?: SocialLink["id"][];
  className?: string;
};

/**
 * Social links come from config (env today, admin settings later). A link
 * that hasn't been configured renders as a visibly disabled control rather
 * than pointing somewhere invented.
 */
export function SocialLinks({ variant = "icons", only, className }: Props) {
  const links = siteConfig.social.filter((s) => !only || only.includes(s.id));

  return (
    <ul className={[styles.list, styles[variant], className].filter(Boolean).join(" ")}>
      {links.map((link) => {
        const Icon = ICONS[link.id];
        const content = (
          <>
            <span className={`${styles.icon} ${styles[link.id]}`}>
              <Icon size={variant === "cards" ? 22 : 18} />
            </span>
            {variant !== "icons" && (
              <span className={styles.text}>
                <span className={styles.label}>{link.label}</span>
                <span className={styles.handle}>{link.href ? link.handle : `${link.handle} · link coming soon`}</span>
              </span>
            )}
          </>
        );

        return (
          <li key={link.id}>
            {link.href ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
                aria-label={variant === "icons" ? `FoundingVFX on ${link.label} (opens in new tab)` : undefined}
                title={variant === "icons" ? `${link.label} · ${link.handle}` : undefined}
              >
                {content}
              </a>
            ) : (
              <span
                className={`${styles.link} ${styles.disabled}`}
                aria-disabled="true"
                role={variant === "icons" ? "img" : undefined}
                aria-label={variant === "icons" ? `${link.label} link coming soon` : undefined}
                title={`${link.label} link coming soon`}
              >
                {content}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
