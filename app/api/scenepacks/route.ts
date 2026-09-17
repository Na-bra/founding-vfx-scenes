import type { NextRequest } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data";
import { PUBLIC_CACHE, guardRead } from "@/lib/server/api";
import { parseScenePackQuery } from "@/lib/scenepack-query";

const idsSchema = z.array(z.string().regex(/^[a-z0-9_]+$/i).max(64)).max(100);

/**
 * GET /api/scenepacks            — paginated, filterable list
 * GET /api/scenepacks?ids=a,b,c  — specific published packs (used by favorites)
 */
export async function GET(request: NextRequest) {
  const blocked = guardRead(request);
  if (blocked) return blocked;

  const repo = getRepository();
  const params = request.nextUrl.searchParams;

  const idsParam = params.get("ids");
  if (idsParam !== null) {
    const ids = idsSchema.safeParse(idsParam.split(",").filter(Boolean));
    if (!ids.success) return Response.json({ error: "Invalid ids" }, { status: 400 });
    return Response.json({ items: await repo.getScenePacksByIds(ids.data) });
  }

  const pageSize = Math.min(Math.max(Number(params.get("pageSize")) || 24, 1), 48);
  const result = await repo.listScenePacks({ ...parseScenePackQuery(params), pageSize });
  return Response.json(result, { headers: PUBLIC_CACHE });
}
