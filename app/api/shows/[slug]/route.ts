import type { NextRequest } from "next/server";
import { getRepository } from "@/lib/data";
import { PUBLIC_CACHE, guardRead, notFoundJson } from "@/lib/server/api";

export async function GET(request: NextRequest, ctx: RouteContext<"/api/shows/[slug]">) {
  const blocked = guardRead(request);
  if (blocked) return blocked;
  const result = await getRepository().getShow((await ctx.params).slug);
  return result ? Response.json(result, { headers: PUBLIC_CACHE }) : notFoundJson("Show");
}
