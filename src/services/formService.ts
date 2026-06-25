import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import type { DiagnosticForm, FormSection, Question, FullForm, FormStatus } from "@/types";

const col = collection(db, "forms");

export async function listForms(): Promise<DiagnosticForm[]> {
  const snap = await getDocs(col);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DiagnosticForm);
}

export async function listActiveForms(): Promise<DiagnosticForm[]> {
  const snap = await getDocs(query(col, where("status", "==", "active")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DiagnosticForm);
}

export async function getForm(id: string): Promise<DiagnosticForm | null> {
  const snap = await getDoc(doc(db, "forms", id));
  return snap.exists() ? ({ id, ...snap.data() } as DiagnosticForm) : null;
}

export async function getSections(formId: string): Promise<FormSection[]> {
  const snap = await getDocs(
    query(collection(db, "forms", formId, "sections"), orderBy("order")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FormSection);
}

export async function getQuestions(formId: string): Promise<Question[]> {
  const snap = await getDocs(
    query(collection(db, "forms", formId, "questions"), orderBy("order")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Question);
}

export async function getFullForm(formId: string): Promise<FullForm | null> {
  const form = await getForm(formId);
  if (!form) return null;
  const [sections, questions] = await Promise.all([
    getSections(formId),
    getQuestions(formId),
  ]);
  return { form, sections, questions };
}

export type FormInput = Pick<DiagnosticForm, "name" | "description" | "variables">;

export async function createForm(
  data: FormInput,
  createdBy: string,
): Promise<string> {
  const ref = await addDoc(col, {
    ...data,
    version: 1,
    status: "draft" as FormStatus,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateForm(id: string, data: Partial<DiagnosticForm>) {
  await updateDoc(doc(db, "forms", id), { ...data, updatedAt: serverTimestamp() });
}

export async function setFormStatus(id: string, status: FormStatus) {
  await updateDoc(doc(db, "forms", id), { status, updatedAt: serverTimestamp() });
}

export async function saveSection(
  formId: string,
  section: Omit<FormSection, "id">,
  id?: string,
): Promise<string> {
  if (id) {
    await setDoc(doc(db, "forms", formId, "sections", id), section, { merge: true });
    return id;
  }
  const ref = await addDoc(collection(db, "forms", formId, "sections"), section);
  return ref.id;
}

export async function saveQuestion(
  formId: string,
  question: Omit<Question, "id">,
  id?: string,
): Promise<string> {
  if (id) {
    await setDoc(doc(db, "forms", formId, "questions", id), question, { merge: true });
    return id;
  }
  const ref = await addDoc(collection(db, "forms", formId, "questions"), question);
  return ref.id;
}
