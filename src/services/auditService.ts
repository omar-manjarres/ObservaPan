import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit as fbLimit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import type { AuditLog, AuditAction } from "@/types";

const col = collection(db, "auditLogs");

export async function listAuditLogs(max = 200): Promise<AuditLog[]> {
  const snap = await getDocs(query(col, orderBy("createdAt", "desc"), fbLimit(max)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditLog);
}

export interface AuditInput {
  userId: string;
  userEmail: string;
  action: AuditAction;
  module: string;
  documentId?: string;
  description: string;
}

export async function logAudit(input: AuditInput): Promise<void> {
  try {
    await addDoc(col, { ...input, createdAt: serverTimestamp() });
  } catch {
    // auditing must never break the main flow
  }
}
