import type { NextRequest } from "next/server";
import { getRepository } from "@/lib/data";
import { clientFingerprint, rateLimit, tooManyRequests } from "@/lib/server/rate-limit";

/**
 * Search-first request flow: before anyone submits a request, surface
 * existing ScenePacks and existing requests that already cover it.
 */
export async function GET(request: NextRequest) {
  const limit = rateLimit(clientFingerprint(request, "request-similar"), 60, 60_000);
  if (!limit.ok) return tooManyRequests(limit);

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 120);
  if (q.length < 2) return Response.json({ scenePacks: [], requests: [] });

  const repo = getRepository();
  const [packs, requests] = await Promise.all([repo.listScenePacks({ q, pageSize: 4 }), repo.listRequests({ q, limit: 5 })]);

  return Response.json({
    scenePacks: packs.items.map((p) => ({
      slug: p.slug,
      title: p.title,
      show: p.show.title,
      resolution: p.technical.resolution,
      fps: p.technical.fps,
    })),
    requests: requests.map((r) => ({ id: r.id, title: r.title, showTitle: r.showTitle, status: r.status, voteCount: r.voteCount })),
  });
}
