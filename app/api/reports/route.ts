import type { NextRequest } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data";
import { clientFingerprint, rateLimit, tooManyRequests } from "@/lib/server/rate-limit";

const reportSchema = z.object({
  scenePackId: z.string().regex(/^[a-z0-9_]+$/i).max(64),
  reason: z.enum(["broken_download", "incorrect_information", "incorrect_thumbnail", "duplicate", "other"]),
  details: z.string().trim().max(500).optional(),
});

/**
 * Same-origin check against the host the browser actually addressed.
 * `request.nextUrl.host` reflects the server's bind address in standalone
 * mode (e.g. 0.0.0.0), so compare with the Host / X-Forwarded-Host headers.
 */
function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  // Same-origin only: blocks cross-site form posts (CSRF) without needing a token for this anonymous endpoint.
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = rateLimit(clientFingerprint(request, "report"), 5, 10 * 60_000);
  if (!limit.ok) return tooManyRequests(limit);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid report" }, { status: 400 });

  const repo = getRepository();
  const [pack] = await repo.getScenePacksByIds([parsed.data.scenePackId]);
  if (!pack) return Response.json({ error: "ScenePack not found" }, { status: 404 });

  const { id } = await repo.createReport(parsed.data);
  return Response.json({ id }, { status: 201 });
}
