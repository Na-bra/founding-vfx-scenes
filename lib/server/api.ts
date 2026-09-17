import "server-only";

import { clientFingerprint, rateLimit, tooManyRequests } from "./rate-limit";

/** Shared guard for public read APIs: 120 requests / minute per client. */
export function guardRead(request: Request): Response | null {
  const result = rateLimit(clientFingerprint(request, "api-read"), 120, 60_000);
  return result.ok ? null : tooManyRequests(result);
}

export function notFoundJson(what = "Resource") {
  return Response.json({ error: `${what} not found` }, { status: 404 });
}

export const PUBLIC_CACHE = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" };
