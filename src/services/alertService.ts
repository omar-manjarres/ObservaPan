import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import type { Alert, AlertStatus } from "@/types";

const col = collection(db, "alerts");

export async function listAlerts(): Promise<Alert[]> {
  const snap = await getDocs(query(col, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Alert);
}

export async function listAlertsByBakery(bakeryId: string): Promise<Alert[]> {
  const snap = await getDocs(query(col, where("bakeryId", "==", bakeryId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Alert);
}

export type AlertInput = Omit<Alert, "id" | "createdAt" | "updatedAt">;

export async function createAlert(data: AlertInput): Promise<string> {
  const ref = await addDoc(col, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function setAlertStatus(id: string, status: AlertStatus) {
  await updateDoc(doc(db, "alerts", id), { status, updatedAt: serverTimestamp() });
}
