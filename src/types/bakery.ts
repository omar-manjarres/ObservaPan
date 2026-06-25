import type { Timestamp } from "firebase/firestore";

export type CompanySize = "micro" | "small" | "medium";
export type ProductionType = "artisanal" | "semi_industrial" | "industrial";
export type BakeryStatus = "active" | "inactive";

export interface Bakery {
  id: string;
  businessName: string;
  ownerName: string;
  nit?: string;
  phone?: string;
  email?: string;
  address?: string;
  neighborhood?: string;
  commune?: string;
  city: string;
  department: string;
  startYear?: number;
  employeeCount?: number;
  bakeryType?: string;
  companySize?: CompanySize;
  productionType?: ProductionType;
  status: BakeryStatus;
  notes?: string;
  createdBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}
