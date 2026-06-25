import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Timestamp } from "firebase/firestore";

export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const v = value as { toDate?: () => Date; seconds?: number };
  if (typeof v.toDate === "function") return v.toDate();
  if (typeof v.seconds === "number") return new Date(v.seconds * 1000);
  return null;
}

export function formatDate(value: unknown, pattern = "dd/MM/yyyy"): string {
  const d = toDate(value);
  return d ? format(d, pattern, { locale: es }) : "—";
}

export function formatDateTime(value: unknown): string {
  return formatDate(value, "dd/MM/yyyy HH:mm");
}

/** Current period in YYYY-MM */
export function currentPeriod(): string {
  return format(new Date(), "yyyy-MM");
}

/** Human label for a YYYY-MM period. */
export function periodLabel(period: string): string {
  const [y, m] = period.split("-");
  if (!y || !m) return period;
  const d = new Date(Number(y), Number(m) - 1, 1);
  return format(d, "MMMM yyyy", { locale: es });
}

export function nowTs(): Date {
  return new Date();
}

export type { Timestamp };
