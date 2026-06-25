import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import type { Bakery } from "@/types";

const col = collection(db, "bakeries");

export async function listBakeries(): Promise<Bakery[]> {
  const snap = await getDocs(col);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Bakery);
}

export async function getBakery(id: string): Promise<Bakery | null> {
  const snap = await getDoc(doc(db, "bakeries", id));
  return snap.exists() ? ({ id, ...snap.data() } as Bakery) : null;
}

export type BakeryInput = Omit<Bakery, "id" | "createdAt" | "updatedAt">;

export async function createBakery(data: BakeryInput): Promise<string> {
  const ref = await addDoc(col, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateBakery(id: string, data: Partial<BakeryInput>) {
  await updateDoc(doc(db, "bakeries", id), { ...data, updatedAt: serverTimestamp() });
}

export async function setBakeryStatus(id: string, status: "active" | "inactive") {
  await updateDoc(doc(db, "bakeries", id), { status, updatedAt: serverTimestamp() });
}
