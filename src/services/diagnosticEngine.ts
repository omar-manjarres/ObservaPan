import type {
  DiagnosticRecord,
  Question,
  VariableScores,
  Variable,
  Bakery,
  AppConfig,
} from "@/types";
import {
  calculateTrend,
  calculateRiskLevel,
  compareWithSectorAverage,
} from "@/utils/scoring";
import { createSnapshot } from "./indicatorService";
import { createAlert } from "./alertService";
import { variableLabel } from "@/utils/formatters";

const RECOMMENDATIONS: Record<Variable, string> = {
  productive:
    "Se recomienda fortalecer el registro de inventarios, fechas de vencimiento y rotación de insumos, así como la planeación de la producción.",
  administrative:
    "Se recomienda implementar registros básicos de ingresos, gastos y costos de producción, y apoyar la toma de decisiones con datos.",
  commercial:
    "Se recomienda llevar seguimiento de productos más vendidos, clientes frecuentes y canales de venta, e impulsar la presencia digital.",
};

const VARS: Variable[] = ["productive", "administrative", "commercial"];

export interface ProcessResult {
  snapshotId: string;
  alertsCreated: number;
}

/**
 * After a record is completed, computes the indicator snapshot, compares with
 * the previous period and the sector average, and generates automatic alerts.
 */
export async function processCompletedRecord(params: {
  record: DiagnosticRecord;
  recordId: string;
  bakery: Bakery;
  previousScores: VariableScores | null;
  sectorScores: VariableScores | null;
  questions: Question[];
  config: AppConfig;
}): Promise<ProcessResult> {
  const { record, recordId, bakery, previousScores, sectorScores, questions, config } =
    params;
  const { scores } = record;
  const highBelow = config.alertThresholds.highRiskBelow;
  const mediumBelow = config.alertThresholds.mediumRiskBelow;

  const trend = calculateTrend(scores.global, previousScores?.global ?? null);
  const riskLevel = calculateRiskLevel(scores.global, highBelow, mediumBelow);
  const sectorComparison = sectorScores
    ? compareWithSectorAverage(scores, sectorScores)
    : undefined;

  const snapshotId = await createSnapshot({
    bakeryId: record.bakeryId,
    recordId,
    period: record.period,
    productiveScore: scores.productive,
    administrativeScore: scores.administrative,
    commercialScore: scores.commercial,
    globalScore: scores.global,
    trend,
    riskLevel,
    sectorComparison,
  });

  let alertsCreated = 0;

  // 1. Global critical score
  if (scores.global !== null && scores.global < highBelow) {
    await createAlert({
      bakeryId: record.bakeryId,
      recordId,
      variable: "global",
      type: "critical_score",
      severity: "high",
      title: `Puntaje global crítico (${scores.global.toFixed(2)})`,
      description: `${bakery.businessName} presenta un puntaje global por debajo del umbral crítico en ${record.period}.`,
      recommendation:
        "Se recomienda una intervención integral en las tres dimensiones del diagnóstico.",
      status: "active",
    });
    alertsCreated++;
  }

  // 2. Per-variable critical score
  for (const v of VARS) {
    const s = scores[v];
    if (s !== null && s < highBelow) {
      await createAlert({
        bakeryId: record.bakeryId,
        recordId,
        variable: v,
        type: "critical_score",
        severity: s < highBelow - 0.5 ? "high" : "medium",
        title: `Gestión ${variableLabel(v).toLowerCase()} débil (${s.toFixed(2)})`,
        description: `El puntaje de la variable ${variableLabel(v)} es bajo en ${record.period}.`,
        recommendation: RECOMMENDATIONS[v],
        status: "active",
      });
      alertsCreated++;
    }
  }

  // 3. Decline vs previous period
  if (previousScores) {
    for (const v of VARS) {
      const cur = scores[v];
      const prev = previousScores[v];
      if (cur !== null && prev !== null && cur - prev < -0.2) {
        await createAlert({
          bakeryId: record.bakeryId,
          recordId,
          variable: v,
          type: "decline",
          severity: "medium",
          title: `Retroceso en gestión ${variableLabel(v).toLowerCase()}`,
          description: `La variable ${variableLabel(v)} bajó de ${prev.toFixed(2)} a ${cur.toFixed(2)} respecto al periodo anterior.`,
          recommendation: RECOMMENDATIONS[v],
          status: "active",
        });
        alertsCreated++;
      }
    }
  }

  // 4. Frequent unfavourable negative answers
  const negativeUnfavorable = record.responses.filter((r) => {
    const q = questions.find((x) => x.id === r.questionId);
    return q?.direction === "negative" && typeof r.score === "number" && r.score <= 2;
  });
  if (negativeUnfavorable.length >= 2) {
    await createAlert({
      bakeryId: record.bakeryId,
      recordId,
      type: "frequent_problem",
      severity: "medium",
      title: "Problemáticas recurrentes detectadas",
      description: `Se detectaron ${negativeUnfavorable.length} respuestas desfavorables en aspectos de riesgo (faltantes, deterioro, dificultades).`,
      recommendation:
        "Revisar los procesos asociados a las respuestas desfavorables y establecer acciones correctivas.",
      status: "active",
    });
    alertsCreated++;
  }

  return { snapshotId, alertsCreated };
}

export function buildRecommendations(scores: VariableScores, highBelow = 2.5): string[] {
  const recs: string[] = [];
  for (const v of VARS) {
    const s = scores[v];
    if (s !== null && s < highBelow + 1) recs.push(RECOMMENDATIONS[v]);
  }
  if (recs.length === 0)
    recs.push("La panadería muestra un desempeño adecuado. Se recomienda sostener las buenas prácticas y documentarlas.");
  return recs;
}
