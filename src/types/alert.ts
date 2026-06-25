import type { Timestamp } from "firebase/firestore";
import type { VariableOrGlobal } from "./common";

export type AlertType =
  | "critical_score"
  | "decline"
  | "missing_update"
  | "frequent_problem"
  | "information";
export type Severity = "low" | "medium" | "high";
export type AlertStatus = "active" | "reviewed" | "closed";

export interface Alert {
  id: string;
  bakeryId?: string;
  recordId?: string;
  variable?: VariableOrGlobal;
  type: AlertType;
  severity: Severity;
  title: string;
  description: string;
  recommendation?: string;
  status: AlertStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}
