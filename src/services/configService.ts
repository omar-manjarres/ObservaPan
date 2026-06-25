import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";
import type { AppConfig } from "@/types";
import { currentPeriod } from "@/utils/dates";

const ref = doc(db, "appConfig", "main");

export const DEFAULT_CONFIG: AppConfig = {
  appName: "ObservaPan",
  city: "Valledupar",
  activePeriod: currentPeriod(),
  alertThresholds: { highRiskBelow: 2.5, mediumRiskBelow: 3.5 },
  reportSettings: { anonymizeSectorReports: false },
  institutionName: "Observatorio Empresarial del Sector Panadero de Valledupar",
  updatedAt: null,
};

export async function getConfig(): Promise<AppConfig> {
  const snap = await getDoc(ref);
  if (!snap.exists()) return DEFAULT_CONFIG;
  return { ...DEFAULT_CONFIG, ...snap.data() } as AppConfig;
}

export async function saveConfig(data: Partial<AppConfig>): Promise<void> {
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}
