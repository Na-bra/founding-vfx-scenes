import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Liveness/readiness probe for containers and load balancers. */
export async function GET() {
  try {
    await getRepository().getSiteCounts();
    return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "error" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
