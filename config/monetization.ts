import "server-only";

/**
 * Monetization is OFF by default. The download service consults this before
 * sending anyone to a destination. Enabling a provider without configuring it
 * is treated as disabled — we never send visitors through a half-configured
 * redirect.
 */

export type DownloadMode = "direct" | "monetized";

export type MonetizationSettings = {
  adsEnabled: boolean;
  downloadMode: DownloadMode;
  linkvertise: { enabled: boolean; publisherId: string | null };
  interstitialEnabled: boolean;
};

export function getMonetizationSettings(): MonetizationSettings {
  const publisherId = process.env.LINKVERTISE_PUBLISHER_ID || null;
  const linkvertiseEnabled = process.env.MONETIZATION_LINKVERTISE === "true" && publisherId !== null;

  return {
    adsEnabled: process.env.MONETIZATION_ADS === "true",
    downloadMode:
      process.env.MONETIZATION_DOWNLOAD_MODE === "monetized" && linkvertiseEnabled ? "monetized" : "direct",
    linkvertise: { enabled: linkvertiseEnabled, publisherId },
    interstitialEnabled: process.env.MONETIZATION_INTERSTITIAL === "true",
  };
}
