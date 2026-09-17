import "server-only";

import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { ForbiddenError } from "./auth";
import type { FormState } from "./form-state";

/* ---------- Field helpers for FormData ---------- */

const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const f = {
  text: (max = 200) => z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().min(1, "Required").max(max)),
  optText: (max = 2000) =>
    z.preprocess((v) => blankToUndefined(typeof v === "string" ? v.trim() : v), z.string().max(max).optional()),
  slug: () =>
    z.preprocess(
      (v) => blankToUndefined(typeof v === "string" ? v.trim().toLowerCase() : v),
      z
        .string()
        .max(80)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens")
        .optional(),
    ),
  int: (min = 0, max = 1_000_000) => z.preprocess(blankToUndefined, z.coerce.number().int().min(min).max(max)),
  optInt: (min = 0, max = 1_000_000) => z.preprocess(blankToUndefined, z.coerce.number().int().min(min).max(max).optional()),
  optNumber: (min = 0, max = Number.MAX_SAFE_INTEGER) => z.preprocess(blankToUndefined, z.coerce.number().min(min).max(max).optional()),
  bool: () => z.preprocess((v) => v === "on" || v === "true" || v === "1", z.boolean()),
  /** "" = unknown, "true"/"false" = known. */
  triState: () => z.preprocess((v) => (v === "true" ? true : v === "false" ? false : null), z.boolean().nullable()),
  ids: () => z.preprocess((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]), z.array(z.string().min(1).max(64)).max(500)),
  list: () =>
    z.preprocess(
      (v) =>
        typeof v === "string"
          ? v
              .split(/[,\n]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      z.array(z.string().max(120)).max(50),
    ),
  url: () =>
    z.preprocess(
      blankToUndefined,
      z
        .string()
        .url("Enter a full URL")
        .refine((u) => /^https:\/\//.test(u) || u.startsWith("/"), "Use an https:// link")
        .optional(),
    ),
  isoDate: () => z.preprocess(blankToUndefined, z.coerce.date().optional()),
  json: <T extends z.ZodTypeAny>(schema: T) =>
    z.preprocess((v) => {
      if (typeof v !== "string" || v === "") return undefined;
      try {
        return JSON.parse(v);
      } catch {
        return undefined;
      }
    }, schema),
};

/** FormData → plain object. Repeated keys become arrays; files are skipped. */
export function formToObject(formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(formData.keys())) {
    if (key.startsWith("$ACTION")) continue;
    const values = formData.getAll(key).filter((v) => typeof v === "string");
    if (values.length === 0) continue;
    out[key] = key.endsWith("[]") || values.length > 1 ? values : values[0];
  }
  // Normalize "name[]" → "name"
  for (const key of Object.keys(out)) {
    if (key.endsWith("[]")) {
      out[key.slice(0, -2)] = out[key];
      delete out[key];
    }
  }
  return out;
}

export function parseForm<T extends z.ZodTypeAny>(schema: T, formData: FormData):
  | { ok: true; data: z.infer<T> }
  | { ok: false; state: FormState } {
  const result = schema.safeParse(formToObject(formData));
  if (result.success) return { ok: true, data: result.data };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".");
    if (!errors[key]) errors[key] = issue.message === "Invalid input" ? "Invalid value" : issue.message;
  }
  return { ok: false, state: { message: "Please fix the highlighted fields.", errors } };
}

/** Turns thrown errors into form messages without leaking internals. */
export function actionError(error: unknown, context: string): FormState {
  if (error instanceof ForbiddenError) return { message: error.message };
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = String((error.meta?.target as string[] | undefined)?.join(", ") ?? "value");
      return { message: `That ${target.includes("slug") ? "slug" : target} is already in use.`, errors: target.includes("slug") ? { slug: "Already in use" } : undefined };
    }
    if (error.code === "P2003") return { message: `This ${context} is still used by other records. Remove those links first.` };
    if (error.code === "P2025") return { message: `This ${context} no longer exists.` };
  }
  if (error instanceof UploadError) return { message: error.message, errors: { [error.field]: error.message } };
  console.error(`[admin] ${context} failed`, error);
  return { message: "Something went wrong. Please try again." };
}

export class UploadError extends Error {
  constructor(
    public field: string,
    message: string,
  ) {
    super(message);
  }
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Next.js redirect()/notFound() throw special errors that must propagate. */
export function isNavigationError(error: unknown): boolean {
  const digest = (error as { digest?: unknown })?.digest;
  return typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK"));
}
