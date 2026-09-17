"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { authorize } from "@/lib/admin/auth";
import { audit, diff } from "@/lib/admin/audit";
import { contentChanged } from "@/lib/admin/content";
import { actionError, f, isNavigationError, parseForm } from "@/lib/admin/forms";
import type { FormState } from "@/lib/admin/form-state";
import { resolutionToDb } from "@/lib/data/prisma/mappers";

/* ---------------- Requests ---------------- */

const requestSchema = z.object({
  title: f.text(160),
  showTitle: f.text(160),
  showId: f.optText(64),
  characterName: f.optText(120),
  description: f.optText(2000),
  year: f.optInt(1900, 2100),
  season: f.optInt(0, 99),
  episode: f.optInt(0, 999),
  genreId: f.optText(64),
  channelId: f.optText(64),
  preferredResolution: z.preprocess((v) => (v === "" ? undefined : v), z.enum(["720p", "1080p", "1440p", "4K"]).optional()),
  preferredFps: f.optInt(1, 240),
  status: z.enum(["pending", "under_review", "planned", "in_progress", "completed", "published", "declined"]),
  highPriority: f.bool(),
  fulfilledByScenePackId: f.optText(64),
});

export async function saveRequest(id: string, _: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("community.moderate");
    const parsed = parseForm(requestSchema, formData);
    if (!parsed.ok) return parsed.state;
    const d = parsed.data;
    if (d.status === "published" && !d.fulfilledByScenePackId) {
      return { message: "Choose the ScenePack that fulfils this request.", errors: { fulfilledByScenePackId: "Required when published" } };
    }
    const db = getDb();
    const before = await db.sceneRequest.findUnique({ where: { id } });
    if (!before) return { message: "This request no longer exists." };
    const data = {
      title: d.title,
      showTitle: d.showTitle,
      showId: d.showId ?? null,
      characterName: d.characterName ?? null,
      description: d.description ?? "",
      year: d.year ?? null,
      season: d.season ?? null,
      episode: d.episode ?? null,
      genreId: d.genreId ?? null,
      channelId: d.channelId ?? null,
      preferredResolution: d.preferredResolution ? resolutionToDb(d.preferredResolution) : null,
      preferredFps: d.preferredFps ?? null,
      status: d.status,
      highPriority: d.highPriority,
      fulfilledByScenePackId: d.fulfilledByScenePackId ?? null,
    };
    await db.sceneRequest.update({ where: { id }, data });
    await audit(admin, "request.update", { type: "request", id, label: d.title }, diff(before, data));
    contentChanged();
    return { ok: true, message: "Saved." };
  } catch (error) {
    return actionError(error, "request");
  }
}

export async function setRequestStatus(_: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("community.moderate");
    const id = String(formData.get("id"));
    const status = z.enum(["under_review", "planned", "in_progress", "completed", "declined"]).parse(formData.get("status"));
    const db = getDb();
    const before = await db.sceneRequest.update({ where: { id }, data: { status } });
    await audit(admin, "request.status", { type: "request", id, label: before.title }, { status: { to: status } });
    contentChanged();
    return { ok: true, message: `Marked ${status.replace("_", " ")}.` };
  } catch (error) {
    return actionError(error, "request");
  }
}

export async function deleteRequest(_: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("community.moderate");
    const id = String(formData.get("id"));
    const before = await getDb().sceneRequest.delete({ where: { id } });
    await audit(admin, "request.delete", { type: "request", id, label: before.title });
    contentChanged();
    redirect("/admin/requests");
  } catch (error) {
    if (isNavigationError(error)) throw error;
    return actionError(error, "request");
  }
}

/* ---------------- Reports ---------------- */

export async function setReportStatus(_: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("community.moderate");
    const id = String(formData.get("id"));
    const status = z.enum(["open", "resolved", "dismissed"]).parse(formData.get("status"));
    const report = await getDb().report.update({
      where: { id },
      data: { status, resolvedAt: status === "open" ? null : new Date() },
      include: { scenePack: { select: { title: true } } },
    });
    await audit(admin, `report.${status}`, { type: "report", id, label: report.scenePack.title }, { status: { to: status } });
    contentChanged();
    return { ok: true, message: status === "open" ? "Reopened." : `Marked ${status}.` };
  } catch (error) {
    return actionError(error, "report");
  }
}

/* ---------------- Announcements ---------------- */

const announcementSchema = z
  .object({
    message: f.text(240),
    href: f.url(),
    tone: z.enum(["info", "success", "warning"]),
    active: f.bool(),
    startsAt: f.isoDate(),
    endsAt: f.isoDate(),
  })
  .refine((d) => !d.startsAt || !d.endsAt || d.endsAt > d.startsAt, { message: "Must be after the start", path: ["endsAt"] });

export async function createAnnouncement(_: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("site.write");
    const parsed = parseForm(announcementSchema, formData);
    if (!parsed.ok) return parsed.state;
    const d = parsed.data;
    const created = await getDb().announcement.create({
      data: { message: d.message, href: d.href ?? null, tone: d.tone, active: d.active, startsAt: d.startsAt ?? null, endsAt: d.endsAt ?? null },
    });
    await audit(admin, "announcement.create", { type: "announcement", id: created.id, label: d.message });
    contentChanged();
    return { ok: true, message: "Announcement added." };
  } catch (error) {
    return actionError(error, "announcement");
  }
}

export async function toggleAnnouncement(_: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("site.write");
    const id = String(formData.get("id"));
    const active = formData.get("active") === "true";
    const a = await getDb().announcement.update({ where: { id }, data: { active } });
    await audit(admin, active ? "announcement.show" : "announcement.hide", { type: "announcement", id, label: a.message });
    contentChanged();
    return { ok: true, message: active ? "Announcement is live." : "Announcement hidden." };
  } catch (error) {
    return actionError(error, "announcement");
  }
}

export async function deleteAnnouncement(_: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("site.write");
    const id = String(formData.get("id"));
    const a = await getDb().announcement.delete({ where: { id } });
    await audit(admin, "announcement.delete", { type: "announcement", id, label: a.message });
    contentChanged();
    return { ok: true, message: "Deleted." };
  } catch (error) {
    return actionError(error, "announcement");
  }
}

/* ---------------- Changelog ---------------- */

const changelogSchema = z.object({
  date: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.date({ message: "Pick a date" })),
  title: f.text(120),
  changes: z.preprocess(
    (v) =>
      typeof v === "string"
        ? v
            .split("\n")
            .map((l) => l.replace(/^[-+*•]\s*/, "").trim())
            .filter(Boolean)
        : [],
    z.array(z.string().max(200)).min(1, "Add at least one change").max(40),
  ),
});

export async function createChangelogEntry(_: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("site.write");
    const parsed = parseForm(changelogSchema, formData);
    if (!parsed.ok) return parsed.state;
    const created = await getDb().changelogEntry.create({ data: parsed.data });
    await audit(admin, "changelog.create", { type: "changelog", id: created.id, label: parsed.data.title });
    contentChanged();
    return { ok: true, message: "Changelog entry published." };
  } catch (error) {
    return actionError(error, "changelog entry");
  }
}

export async function deleteChangelogEntry(_: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("site.write");
    const id = String(formData.get("id"));
    const e = await getDb().changelogEntry.delete({ where: { id } });
    await audit(admin, "changelog.delete", { type: "changelog", id, label: e.title });
    contentChanged();
    return { ok: true, message: "Deleted." };
  } catch (error) {
    return actionError(error, "changelog entry");
  }
}
