import type { Timestamp } from "firebase/firestore";

export interface AppConfig {
  appName: string;
  city: string;
  activePeriod: string;
  alertThresholds: {
    highRiskBelow: number;
    mediumRiskBelow: number;
  };
  reportSettings: {
    anonymizeSectorReports: boolean;
  };
  institutionName?: string;
  updatedAt: Timestamp | null;
}
