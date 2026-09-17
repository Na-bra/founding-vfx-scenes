import type { NextRequest } from "next/server";
import { getRepository } from "@/lib/data";
import { clientFingerprint, rateLimit, tooManyRequests } from "@/lib/server/rate-limit";

export async function GET(request: NextRequest) {
  const limit = rateLimit(clientFingerprint(request, "suggest"), 90, 60_000);
  if (!limit.ok) return tooManyRequests(limit);

  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 120);
  const suggestions = q.trim() ? await getRepository().suggest(q, 8) : [];
  return Response.json({ suggestions }, { headers: { "Cache-Control": "public, s-maxage=30" } });
}
