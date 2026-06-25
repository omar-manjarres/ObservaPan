import type { AppUser, Role } from "@/types";

export function hasRole(user: AppUser | null, ...roles: Role[]): boolean {
  return !!user && roles.includes(user.role);
}

export function canManageUsers(user: AppUser | null): boolean {
  return hasRole(user, "admin");
}

export function canManageForms(user: AppUser | null): boolean {
  return hasRole(user, "admin");
}

export function canManageBakeries(user: AppUser | null): boolean {
  return hasRole(user, "admin");
}

export function canCreateRecords(user: AppUser | null): boolean {
  return hasRole(user, "admin", "surveyor", "bakery");
}

export function canEditRecord(
  user: AppUser | null,
  recordStatus: "draft" | "completed",
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role === "surveyor" || user.role === "bakery") return recordStatus === "draft";
  return false;
}

export function canViewBakery(user: AppUser | null, bakeryId: string): boolean {
  if (!user) return false;
  switch (user.role) {
    case "admin":
    case "consultant":
      return true;
    case "surveyor":
      return (user.assignedBakeryIds ?? []).includes(bakeryId);
    case "bakery":
      return user.bakeryId === bakeryId;
    default:
      return false;
  }
}

export function canViewSectorReports(user: AppUser | null): boolean {
  return hasRole(user, "admin", "consultant");
}

export function canExportReports(user: AppUser | null): boolean {
  return hasRole(user, "admin", "consultant", "bakery");
}

export function canViewAudit(user: AppUser | null): boolean {
  return hasRole(user, "admin");
}

export function canEditSettings(user: AppUser | null): boolean {
  return hasRole(user, "admin");
}

/** Bakery ids a user is scoped to, or null = all. */
export function scopedBakeryIds(user: AppUser | null): string[] | null {
  if (!user) return [];
  if (user.role === "admin" || user.role === "consultant") return null;
  if (user.role === "surveyor") return user.assignedBakeryIds ?? [];
  if (user.role === "bakery") return user.bakeryId ? [user.bakeryId] : [];
  return [];
}
