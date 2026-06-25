import type { DiagnosticRecord, Variable, VariableScores } from "@/types";
import { VARIABLES, VARIABLE_LABELS } from "@/constants/variables";
import { averageScores } from "@/utils/scoring";

export function sectorAverageFromRecords(
  records: DiagnosticRecord[],
): VariableScores {
  return averageScores(records.map((r) => r.scores));
}

export function weakestVariable(scores: VariableScores): Variable {
  return [...VARIABLES].sort(
    (a, b) => (scores[a] ?? 99) - (scores[b] ?? 99),
  )[0];
}

export function strongestVariable(scores: VariableScores): Variable {
  return [...VARIABLES].sort(
    (a, b) => (scores[b] ?? -1) - (scores[a] ?? -1),
  )[0];
}

/** Ranks negative/unfavourable responses across records by frequency. */
export function rankProblems(
  records: DiagnosticRecord[],
): { label: string; count: number }[] {
  const counter = new Map<string, number>();
  for (const r of records) {
    for (const resp of r.responses) {
      if (typeof resp.score === "number" && resp.score <= 2) {
        counter.set(resp.questionText, (counter.get(resp.questionText) ?? 0) + 1);
      }
    }
  }
  return [...counter.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export function sectorConclusions(
  scores: VariableScores,
  total: number,
): string[] {
  const out: string[] = [];
  if (total === 0) return ["No hay registros suficientes para generar conclusiones."];
  const weak = weakestVariable(scores);
  const strong = strongestVariable(scores);
  out.push(
    `Se evaluaron ${total} panadería(s) en el periodo. El puntaje global promedio del sector es ${
      scores.global?.toFixed(2) ?? "—"
    }.`,
  );
  out.push(
    `La dimensión con mayor debilidad es la gestión ${VARIABLE_LABELS[
      weak
    ].toLowerCase()}, mientras que la de mejor comportamiento es la gestión ${VARIABLE_LABELS[
      strong
    ].toLowerCase()}.`,
  );
  if ((scores.global ?? 0) < 2.5)
    out.push("El sector presenta un nivel crítico y requiere acompañamiento prioritario.");
  else if ((scores.global ?? 0) < 3.5)
    out.push("El sector se encuentra en desarrollo; existen oportunidades claras de mejora.");
  else out.push("El sector muestra un desempeño adecuado en términos generales.");
  return out;
}
