export type Role = "admin" | "editor" | "viewer";

export const ROLES: readonly Role[] = ["admin", "editor", "viewer"];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Visualizador",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}
