import type { Variable, VariableOrGlobal } from "@/types";

export const VARIABLE_LABELS: Record<VariableOrGlobal, string> = {
  productive: "Productiva",
  administrative: "Administrativa",
  commercial: "Comercial",
  global: "Global",
};

export const VARIABLES: Variable[] = ["productive", "administrative", "commercial"];

export const VARIABLE_COLORS: Record<VariableOrGlobal, string> = {
  productive: "#bb7f42",
  administrative: "#2563eb",
  commercial: "#16a34a",
  global: "#6b432c",
};

// Frequency scale base scores (positive direction)
export const FREQUENCY_OPTIONS = [
  "Nunca",
  "Casi nunca",
  "A veces",
  "Casi siempre",
  "Siempre",
] as const;

export const FREQUENCY_SCORES: Record<string, number> = {
  Nunca: 1,
  "Casi nunca": 2,
  "A veces": 3,
  "Casi siempre": 4,
  Siempre: 5,
};

export const LIKERT_OPTIONS = [
  "Totalmente en desacuerdo",
  "En desacuerdo",
  "Neutral",
  "De acuerdo",
  "Totalmente de acuerdo",
] as const;

export const LIKERT_SCORES: Record<string, number> = {
  "Totalmente en desacuerdo": 1,
  "En desacuerdo": 2,
  Neutral: 3,
  "De acuerdo": 4,
  "Totalmente de acuerdo": 5,
};

export const YES_NO_OPTIONS = ["Sí", "No"] as const;
