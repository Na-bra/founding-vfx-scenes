import "server-only";

import { refresh } from "next/cache";
import { invalidateContentSnapshot } from "@/lib/data/prisma/repository";

/**
 * Call from server actions after any write: the public site reloads content
 * on its next request, and the admin page re-renders with the saved data.
 */
export function contentChanged() {
  invalidateContentSnapshot();
  refresh();
}

export const PACK_STATUSES = [
  { value: "draft", label: "Draft — only admins can see it" },
  { value: "published", label: "Published" },
  { value: "scheduled", label: "Scheduled — goes live at the publish time" },
  { value: "unpublished", label: "Unpublished — hidden" },
] as const;
