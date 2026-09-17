import type { Role } from "@/generated/prisma/enums";

/**
 * Role-based permissions. The server checks these on every admin page and
 * action; the UI uses them only to hide controls.
 */
export const PERMISSIONS = {
  "scenepacks.write": ["owner", "administrator", "uploader"],
  "scenepacks.delete": ["owner", "administrator"],
  "scenepacks.feature": ["owner", "administrator"],
  "catalog.write": ["owner", "administrator", "uploader"], // shows, characters, tags
  "catalog.delete": ["owner", "administrator"],
  "taxonomy.write": ["owner", "administrator"], // channels, genres
  "curation.write": ["owner", "administrator"], // playlists, collections
  "community.moderate": ["owner", "administrator", "moderator"], // requests, reports
  "site.write": ["owner", "administrator"], // announcements, changelog
  "audit.read": ["owner", "administrator"],
  "users.manage": ["owner"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export const ADMIN_ROLES = ["owner", "administrator", "moderator", "uploader"] as const satisfies readonly Role[];
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ROLE_LABELS: Record<AdminRole, string> = {
  owner: "Owner",
  administrator: "Administrator",
  moderator: "Moderator",
  uploader: "Uploader",
};

export function can(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export function isAdminRole(role: Role): role is AdminRole {
  return (ADMIN_ROLES as readonly Role[]).includes(role);
}
