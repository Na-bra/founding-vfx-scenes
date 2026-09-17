import "server-only";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { authorize } from "./auth";
import { audit, diff } from "./audit";
import { contentChanged } from "./content";
import { actionError, f, isNavigationError, parseForm, slugify } from "./forms";
import type { FormState } from "./form-state";
import { resolveImageField } from "./upload";

export type TaxonomyKind = "channel" | "genre";

const schema = z.object({
  name: f.text(80),
  slug: f.slug(),
  description: f.optText(600),
});

function delegate(kind: TaxonomyKind) {
  const db = getDb();
  return (kind === "channel" ? db.channel : db.genre) as unknown as {
    findUnique(args: { where: { id: string } }): Promise<{ id: string; name: string; slug: string; description: string; artworkUrl: string | null } | null>;
    create(args: { data: Record<string, unknown> }): Promise<{ id: string }>;
    update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<{ id: string }>;
    delete(args: { where: { id: string } }): Promise<unknown>;
  };
}

/** Shared create/update for channels and genres (identical shape). */
export async function saveTaxonomy(kind: TaxonomyKind, id: string | null, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("taxonomy.write");
    const parsed = parseForm(schema, formData);
    if (!parsed.ok) return parsed.state;
    const { name, description } = parsed.data;
    const slug = parsed.data.slug ?? slugify(name);
    const model = delegate(kind);
    const plural = `${kind}s`;

    if (id) {
      const before = await model.findUnique({ where: { id } });
      if (!before) return { message: `This ${kind} no longer exists.` };
      const artworkUrl = await resolveImageField(formData, "artwork", plural, before.artworkUrl);
      const data = { name, slug, description: description ?? "", ...(artworkUrl !== undefined && { artworkUrl }) };
      await model.update({ where: { id }, data });
      await audit(admin, `${kind}.update`, { type: kind, id, label: name }, diff(before, data));
      contentChanged();
      return { ok: true, message: "Saved." };
    }

    const artworkUrl = (await resolveImageField(formData, "artwork", plural, null)) ?? null;
    const created = await model.create({ data: { name, slug, description: description ?? "", artworkUrl } });
    await audit(admin, `${kind}.create`, { type: kind, id: created.id, label: name });
    contentChanged();
    redirect(`/admin/${plural}/${created.id}?created=1`);
  } catch (error) {
    if (isNavigationError(error)) throw error;
    return actionError(error, kind);
  }
}

export async function deleteTaxonomy(kind: TaxonomyKind, formData: FormData): Promise<FormState> {
  try {
    const admin = await authorize("taxonomy.write");
    const id = String(formData.get("id"));
    const model = delegate(kind);
    const before = await model.findUnique({ where: { id } });
    if (!before) return { message: `This ${kind} no longer exists.` };
    await model.delete({ where: { id } });
    await audit(admin, `${kind}.delete`, { type: kind, id, label: before.name });
    contentChanged();
    redirect(`/admin/${kind}s`);
  } catch (error) {
    if (isNavigationError(error)) throw error;
    return actionError(error, kind);
  }
}
