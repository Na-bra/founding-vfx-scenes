import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";

const COOKIE = "fvx-surprise";
const REMEMBER = 5;

/** Picks a random ScenePack, avoiding the last few surprises for this visitor. */
export async function GET(request: NextRequest) {
  const recent = (request.cookies.get(COOKIE)?.value ?? "")
    .split(".")
    .filter((id) => /^[a-z0-9_]+$/i.test(id))
    .slice(0, REMEMBER);

  const pack = await getRepository().getRandomScenePack(recent);
  if (!pack) return NextResponse.redirect(new URL("/scenepacks", request.url));

  const response = NextResponse.redirect(new URL(`/scenepacks/${pack.slug}`, request.url));
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(COOKIE, [pack.id, ...recent.filter((id) => id !== pack.id)].slice(0, REMEMBER).join("."), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}
