"use server";

import type { FormState } from "@/lib/admin/form-state";
import { deleteTaxonomy, saveTaxonomy } from "@/lib/admin/taxonomy";

export async function saveChannel(id: string | null, _: FormState, formData: FormData) {
  return saveTaxonomy("channel", id, formData);
}
export async function deleteChannel(_: FormState, formData: FormData) {
  return deleteTaxonomy("channel", formData);
}
export async function saveGenre(id: string | null, _: FormState, formData: FormData) {
  return saveTaxonomy("genre", id, formData);
}
export async function deleteGenre(_: FormState, formData: FormData) {
  return deleteTaxonomy("genre", formData);
}
