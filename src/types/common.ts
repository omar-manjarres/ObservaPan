import type { Timestamp } from "firebase/firestore";

export type Variable = "productive" | "administrative" | "commercial";
export type VariableOrGlobal = Variable | "global";
export type FireDate = Timestamp | Date | { seconds: number; nanoseconds: number } | null;
