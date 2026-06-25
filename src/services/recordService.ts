import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { pruneUndefined } from "@/utils/firestore";
import type {
  DiagnosticRecord,
  RecordResponse,
  RecordStatus,
  VariableScores,
  PeriodType,
} from "@/types";

const col = collection(db, "records");

export async function listRecords(): Promise<DiagnosticRecord[]> {
  const snap = await getDocs(query(col, orderBy("period", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DiagnosticRecord);
}

export async function listRecordsByBakery(
  bakeryId: string,
): Promise<DiagnosticRecord[]> {
  const snap = await getDocs(query(col, where("bakeryId", "==", bakeryId)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as DiagnosticRecord)
    .sort((a, b) => a.period.localeCompare(b.period));
}

export async function listCompletedByPeriod(
  period: string,
): Promise<DiagnosticRecord[]> {
  const snap = await getDocs(
    query(col, where("period", "==", period), where("status", "==", "completed")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DiagnosticRecord);
}

export async function getRecord(id: string): Promise<DiagnosticRecord | null> {
  const snap = await getDoc(doc(db, "records", id));
  return snap.exists() ? ({ id, ...snap.data() } as DiagnosticRecord) : null;
}

export interface RecordInput {
  bakeryId: string;
  formId: string;
  formVersion: number;
  period: string;
  periodType: PeriodType;
  status: RecordStatus;
  responses: RecordResponse[];
  scores: VariableScores;
  observations?: string;
  createdBy: string;
}

export async function createRecord(data: RecordInput): Promise<string> {
  const ref = await addDoc(col, {
    ...pruneUndefined(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedAt: data.status === "completed" ? serverTimestamp() : null,
  });
  return ref.id;
}

export async function updateRecord(id: string, data: Partial<RecordInput>) {
  await updateDoc(doc(db, "records", id), {
    ...pruneUndefined(data),
    updatedAt: serverTimestamp(),
    ...(data.status === "completed" ? { completedAt: serverTimestamp() } : {}),
  });
}

/** Returns the most recent completed record before a given period. */
export function previousRecord(
  records: DiagnosticRecord[],
  period: string,
): DiagnosticRecord | null {
  const prior = records
    .filter((r) => r.status === "completed" && r.period < period)
    .sort((a, b) => b.period.localeCompare(a.period));
  return prior[0] ?? null;
}
