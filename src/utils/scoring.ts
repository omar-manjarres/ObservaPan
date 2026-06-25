import {
  FREQUENCY_SCORES,
  LIKERT_SCORES,
} from "@/constants/variables";
import type {
  Question,
  RecordResponse,
  ResponseValue,
  Variable,
  VariableScores,
  Trend,
  RiskLevel,
  IndicatorSnapshot,
  SectorComparison,
} from "@/types";

const MAX_SCALE = 5;

/** Returns the 1-5 base score for a response, before direction handling. */
function baseScore(question: Question, value: ResponseValue): number | null {
  switch (question.type) {
    case "frequency_scale":
      return FREQUENCY_SCORES[String(value)] ?? null;
    case "likert":
      return LIKERT_SCORES[String(value)] ?? null;
    case "yes_no":
      // "Sí" favorable = 5, "No" = 1
      return String(value) === "Sí" || value === true ? 5 : 1;
    case "single_choice": {
      // If options provided, map index proportionally to 1-5
      const opts = question.options ?? [];
      const idx = opts.indexOf(String(value));
      if (idx < 0 || opts.length < 2) return null;
      return 1 + (idx / (opts.length - 1)) * (MAX_SCALE - 1);
    }
    case "multiple_choice": {
      const opts = question.options ?? [];
      const selected = Array.isArray(value) ? value.length : 0;
      if (opts.length === 0) return null;
      return 1 + (selected / opts.length) * (MAX_SCALE - 1);
    }
    default:
      return null; // text/number/date do not score
  }
}

/**
 * Calculates the directional score of a single question.
 * Negative questions invert the scale (5 -> 1, 1 -> 5).
 */
export function calculateQuestionScore(
  question: Question,
  value: ResponseValue,
): number | null {
  if (!question.affectsScore || question.direction === "neutral") return null;
  const base = baseScore(question, value);
  if (base === null) return null;
  if (question.direction === "negative") {
    return MAX_SCALE + 1 - base;
  }
  return base;
}

/** Builds enriched responses with score and weightedScore fields. */
export function buildScoredResponses(
  questions: Question[],
  answers: Record<string, ResponseValue>,
): RecordResponse[] {
  return questions
    .filter((q) => answers[q.id] !== undefined && answers[q.id] !== "")
    .map((q) => {
      const score = calculateQuestionScore(q, answers[q.id]);
      const base: RecordResponse = {
        questionId: q.id,
        questionText: q.text,
        variable: q.variable,
        value: answers[q.id],
      };
      // Only attach score fields when the question actually scores; Firestore
      // rejects `undefined` values, so omit the keys entirely otherwise.
      if (score !== null) {
        base.score = score;
        base.weightedScore = +(score * (q.weight || 1)).toFixed(4);
      }
      return base;
    });
}

/** Weighted average score (1-5) for a single variable. */
export function calculateVariableScore(
  responses: RecordResponse[],
  questions: Question[],
  variable: Variable,
): number | null {
  const weightById = new Map(questions.map((q) => [q.id, q.weight || 1]));
  const scored = responses.filter(
    (r) => r.variable === variable && typeof r.score === "number",
  );
  if (scored.length === 0) return null;
  let weightSum = 0;
  let weighted = 0;
  for (const r of scored) {
    const w = weightById.get(r.questionId) ?? 1;
    weightSum += w;
    weighted += (r.score as number) * w;
  }
  if (weightSum === 0) return null;
  return +(weighted / weightSum).toFixed(2);
}

/** Average of the available variable scores. */
export function calculateGlobalScore(scores: {
  productive: number | null;
  administrative: number | null;
  commercial: number | null;
}): number | null {
  const vals = [scores.productive, scores.administrative, scores.commercial].filter(
    (v): v is number => typeof v === "number",
  );
  if (vals.length === 0) return null;
  return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
}

export function calculateScores(
  responses: RecordResponse[],
  questions: Question[],
): VariableScores {
  const productive = calculateVariableScore(responses, questions, "productive");
  const administrative = calculateVariableScore(responses, questions, "administrative");
  const commercial = calculateVariableScore(responses, questions, "commercial");
  const global = calculateGlobalScore({ productive, administrative, commercial });
  return { productive, administrative, commercial, global };
}

const TREND_DELTA = 0.2;

export function calculateTrend(
  current: number | null,
  previous: number | null,
): Trend {
  if (previous === null || current === null) return "no_previous_data";
  const diff = current - previous;
  if (diff > TREND_DELTA) return "improvement";
  if (diff < -TREND_DELTA) return "decline";
  return "stable";
}

export function calculateRiskLevel(
  score: number | null,
  highBelow = 2.5,
  mediumBelow = 3.5,
): RiskLevel {
  if (score === null) return "medium";
  if (score < highBelow) return "high";
  if (score < mediumBelow) return "medium";
  return "low";
}

export function compareWithSectorAverage(
  current: VariableScores,
  sector: VariableScores,
): SectorComparison {
  const diff = (a: number | null, b: number | null) =>
    a === null || b === null ? null : +(a - b).toFixed(2);
  return {
    productiveDifference: diff(current.productive, sector.productive),
    administrativeDifference: diff(current.administrative, sector.administrative),
    commercialDifference: diff(current.commercial, sector.commercial),
    globalDifference: diff(current.global, sector.global),
  };
}

/** Average scores across many records (used for sector average). */
export function averageScores(
  scoresList: VariableScores[],
): VariableScores {
  const avg = (key: keyof VariableScores) => {
    const vals = scoresList
      .map((s) => s[key])
      .filter((v): v is number => typeof v === "number");
    if (vals.length === 0) return null;
    return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
  };
  return {
    productive: avg("productive"),
    administrative: avg("administrative"),
    commercial: avg("commercial"),
    global: avg("global"),
  };
}

export type SnapshotInput = Omit<IndicatorSnapshot, "id" | "createdAt">;
