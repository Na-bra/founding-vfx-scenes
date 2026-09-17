import "server-only";

import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { UploadError } from "./forms";

const BUCKET = "artwork";
const MAX_BYTES = 5 * 1024 * 1024;

/** Detect image type from file bytes — never trust the browser-supplied type or filename. */
function sniff(bytes: Uint8Array): { ext: string; mime: string } | null {
  const b = bytes;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", mime: "image/png" };
  if (String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP")
    return { ext: "webp", mime: "image/webp" };
  if (String.fromCharCode(...b.slice(4, 8)) === "ftyp" && /avi[fs]/.test(String.fromCharCode(...b.slice(8, 12))))
    return { ext: "avif", mime: "image/avif" };
  return null;
}

/**
 * Uploads an image from a form field to Supabase Storage and returns its
 * public URL, or `undefined` when no file was chosen. Files get a random name,
 * so user-supplied filenames never reach storage paths.
 */
export async function uploadImageField(formData: FormData, field: string, folder: string): Promise<string | undefined> {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) return undefined;
  if (file.size > MAX_BYTES) throw new UploadError(field, "Image must be 5 MB or smaller.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniff(bytes);
  if (!type) throw new UploadError(field, "Upload a JPEG, PNG, WebP or AVIF image.");

  const path = `${folder}/${randomUUID()}.${type.ext}`;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: type.mime, upsert: false });
  if (error) {
    console.error("[admin] image upload failed", error);
    throw new UploadError(field, "Image upload failed. Please try again.");
  }
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Best-effort removal of a replaced image that lives in our bucket. */
export async function deleteStoredImage(url: string | null | undefined) {
  if (!url) return;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return;
  const path = decodeURIComponent(url.slice(index + marker.length));
  try {
    await createSupabaseAdminClient().storage.from(BUCKET).remove([path]);
  } catch (error) {
    console.warn("[admin] could not delete old image", error);
  }
}

/** Handles "upload new / keep / remove" for an image column. Returns the new value or `undefined` for no change. */
export async function resolveImageField(
  formData: FormData,
  field: string,
  folder: string,
  current: string | null,
): Promise<string | null | undefined> {
  const uploaded = await uploadImageField(formData, field, folder);
  if (uploaded) {
    await deleteStoredImage(current);
    return uploaded;
  }
  if (formData.get(`${field}__remove`) === "on") {
    await deleteStoredImage(current);
    return null;
  }
  return undefined;
}
