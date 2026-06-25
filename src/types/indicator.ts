import type { Timestamp } from "firebase/firestore";

export type Trend = "improvement" | "stable" | "decline" | "no_previous_data";
export type RiskLevel = "low" | "medium" | "high";

export interface SectorComparison {
  productiveDifference: number | null;
  administrativeDifference: number | null;
  commercialDifference: number | null;
  globalDifference: number | null;
}

export interface IndicatorSnapshot {
  id: string;
  bakeryId: string;
  recordId: string;
  period: string;
  productiveScore: number | null;
  administrativeScore: number | null;
  commercialScore: number | null;
  globalScore: number | null;
  trend: Trend;
  riskLevel: RiskLevel;
  sectorComparison?: SectorComparison;
  createdAt: Timestamp | null;
}
