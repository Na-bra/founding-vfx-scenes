import type { NextRequest } from "next/server";
import { getRepository } from "@/lib/data";
import { PUBLIC_CACHE, guardRead } from "@/lib/server/api";

export async function GET(request: NextRequest) {
  const blocked = guardRead(request);
  if (blocked) return blocked;
  return Response.json({ items: await getRepository().listCollections() }, { headers: PUBLIC_CACHE });
}
