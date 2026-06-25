import type { Timestamp } from "firebase/firestore";
import type { Variable } from "./common";

export type PeriodType = "monthly" | "quarterly" | "semiannual" | "annual";
export type RecordStatus = "draft" | "completed";
export type ResponseValue = string | number | boolean | string[];

export interface RecordResponse {
  questionId: string;
  questionText: string;
  variable: Variable;
  value: ResponseValue;
  score?: number;
  weightedScore?: number;
}

export interface VariableScores {
  productive: number | null;
  administrative: number | null;
  commercial: number | null;
  global: number | null;
}

export interface DiagnosticRecord {
  id: string;
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
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  completedAt?: Timestamp | null;
}
