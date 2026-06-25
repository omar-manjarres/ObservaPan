import type { RiskLevel, Trend, VariableOrGlobal } from "@/types";
import { VARIABLE_LABELS } from "@/constants/variables";

export function scoreLabel(score: number | null): string {
  return score === null ? "—" : score.toFixed(2);
}

export function riskLabel(level: RiskLevel): string {
  return { low: "Bajo", medium: "Medio", high: "Alto" }[level];
}

export function trendLabel(trend: Trend): string {
  return {
    improvement: "Mejora",
    stable: "Estable",
    decline: "Retroceso",
    no_previous_data: "Sin dato previo",
  }[trend];
}

export function variableLabel(v: VariableOrGlobal): string {
  return VARIABLE_LABELS[v];
}

export function scoreInterpretation(score: number | null): string {
  if (score === null) return "Sin datos";
  if (score >= 4.2) return "Sobresaliente";
  if (score >= 3.5) return "Adecuado";
  if (score >= 2.5) return "En desarrollo";
  return "Crítico";
}

export function initials(name?: string): string {
  if (!name) return "U";
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
