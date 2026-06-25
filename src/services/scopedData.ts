/**
 * Scope-aware data fetchers. Firestore security rules reject broad collection
 * reads for non-admin roles, so bakery and surveyor users must query only the
 * documents they are allowed to see. Admin and consultant read everything.
 */
import type { AppUser, Bakery, DiagnosticRecord, IndicatorSnapshot, Alert } from "@/types";
import { listBakeries, getBakery } from "./bakeryService";
import { listRecords, listRecordsByBakery } from "./recordService";
import { listSnapshots, listSnapshotsByBakery } from "./indicatorService";
import { listAlerts, listAlertsByBakery } from "./alertService";

function isGlobalReader(user: AppUser | null): boolean {
  return user?.role === "admin" || user?.role === "consultant";
}

function scopeIds(user: AppUser | null): string[] {
  if (!user) return [];
  if (user.role === "bakery") return user.bakeryId ? [user.bakeryId] : [];
  if (user.role === "surveyor") return user.assignedBakeryIds ?? [];
  return [];
}

async function flatten<T>(promises: Promise<T[]>[]): Promise<T[]> {
  const chunks = await Promise.all(promises);
  return chunks.flat();
}

export async function listBakeriesScoped(user: AppUser | null): Promise<Bakery[]> {
  if (isGlobalReader(user)) return listBakeries();
  const ids = scopeIds(user);
  const docs = await Promise.all(ids.map((id) => getBakery(id)));
  return docs.filter((b): b is Bakery => b !== null);
}

export async function listRecordsScoped(user: AppUser | null): Promise<DiagnosticRecord[]> {
  if (isGlobalReader(user)) return listRecords();
  return flatten(scopeIds(user).map((id) => listRecordsByBakery(id)));
}

export async function listSnapshotsScoped(user: AppUser | null): Promise<IndicatorSnapshot[]> {
  if (isGlobalReader(user)) return listSnapshots();
  return flatten(scopeIds(user).map((id) => listSnapshotsByBakery(id)));
}

export async function listAlertsScoped(user: AppUser | null): Promise<Alert[]> {
  if (isGlobalReader(user)) return listAlerts();
  return flatten(scopeIds(user).map((id) => listAlertsByBakery(id)));
}
