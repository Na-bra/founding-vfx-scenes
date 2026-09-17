import type { NextRequest } from "next/server";
import { getRepository } from "@/lib/data";
import { PUBLIC_CACHE, guardRead, notFoundJson } from "@/lib/server/api";

export async function GET(request: NextRequest, ctx: RouteContext<"/api/requests/[id]">) {
  const blocked = guardRead(request);
  if (blocked) return blocked;
  const result = await getRepository().getRequest((await ctx.params).id);
  return result ? Response.json(result, { headers: PUBLIC_CACHE }) : notFoundJson("Request");
}
