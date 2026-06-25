import type { Timestamp } from "firebase/firestore";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "deactivate"
  | "login"
  | "export"
  | "generate_report";

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  module: string;
  documentId?: string;
  description: string;
  createdAt: Timestamp | null;
}
