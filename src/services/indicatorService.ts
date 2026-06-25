import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import type { IndicatorSnapshot } from "@/types";
import type { SnapshotInput } from "@/utils/scoring";

const col = collection(db, "indicatorSnapshots");

export async function listSnapshots(): Promise<IndicatorSnapshot[]> {
  const snap = await getDocs(query(col, orderBy("period", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as IndicatorSnapshot);
}

export async function listSnapshotsByBakery(
  bakeryId: string,
): Promise<IndicatorSnapshot[]> {
  const snap = await getDocs(query(col, where("bakeryId", "==", bakeryId)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as IndicatorSnapshot)
    .sort((a, b) => a.period.localeCompare(b.period));
}

export async function createSnapshot(data: SnapshotInput): Promise<string> {
  const ref = await addDoc(col, { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export { doc };
