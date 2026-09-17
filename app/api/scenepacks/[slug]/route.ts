import type { NextRequest } from "next/server";
import { getRepository } from "@/lib/data";
import { PUBLIC_CACHE, guardRead, notFoundJson } from "@/lib/server/api";

export async function GET(request: NextRequest, ctx: RouteContext<"/api/scenepacks/[slug]">) {
  const blocked = guardRead(request);
  if (blocked) return blocked;
  const pack = await getRepository().getScenePack((await ctx.params).slug);
  return pack ? Response.json(pack, { headers: PUBLIC_CACHE }) : notFoundJson("ScenePack");
}
