import type { Timestamp } from "firebase/firestore";

export type Role = "admin" | "surveyor" | "bakery" | "consultant";
export type UserStatus = "active" | "inactive";

export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  role: Role;
  status: UserStatus;
  bakeryId?: string;
  assignedBakeryIds?: string[];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  lastLoginAt?: Timestamp | null;
}
