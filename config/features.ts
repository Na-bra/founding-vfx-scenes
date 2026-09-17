/**
 * Feature flags. Each flag gates UI that depends on infrastructure which may
 * not exist yet, so the interface never pretends a system is live.
 */
export const features = {
  /** Views/downloads are recorded; enables Trending + popularity sorts. */
  analytics: process.env.FEATURE_ANALYTICS === "true",
  /** Accounts exist; enables synced favorites, voting, notifications. */
  accounts: process.env.FEATURE_ACCOUNTS === "true",
  /** Request submission + voting are backed by persistent storage. */
  requestSubmissions: process.env.FEATURE_REQUEST_SUBMISSIONS === "true",
} as const;
