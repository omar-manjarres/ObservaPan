import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import type { AppUser, Role, UserStatus } from "@/types";

const col = collection(db, "users");

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? ({ uid, ...snap.data() } as AppUser) : null;
}

export async function listUsers(): Promise<AppUser[]> {
  const snap = await getDocs(col);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as AppUser);
}

export interface UserUpsert {
  uid: string;
  displayName: string;
  email: string;
  role: Role;
  status: UserStatus;
  bakeryId?: string;
  assignedBakeryIds?: string[];
}

export async function upsertUserProfile(data: UserUpsert): Promise<void> {
  const ref = doc(db, "users", data.uid);
  const exists = (await getDoc(ref)).exists();
  await setDoc(
    ref,
    {
      displayName: data.displayName,
      email: data.email,
      role: data.role,
      status: data.status,
      bakeryId: data.bakeryId ?? null,
      assignedBakeryIds: data.assignedBakeryIds ?? [],
      updatedAt: serverTimestamp(),
      ...(exists ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  );
}

export async function setUserStatus(uid: string, status: UserStatus) {
  await updateDoc(doc(db, "users", uid), { status, updatedAt: serverTimestamp() });
}

export async function setUserBakery(uid: string, bakeryId: string) {
  await updateDoc(doc(db, "users", uid), { bakeryId, updatedAt: serverTimestamp() });
}

export async function touchLastLogin(uid: string) {
  await updateDoc(doc(db, "users", uid), { lastLoginAt: serverTimestamp() }).catch(
    () => undefined,
  );
}
