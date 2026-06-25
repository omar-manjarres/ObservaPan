import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { variableLabel, riskLabel, trendLabel, scoreInterpretation } from "./formatters";
import { periodLabel, formatDate } from "./dates";
import type { Bakery, VariableScores, IndicatorSnapshot, Alert } from "@/types";

const BRAND: [number, number, number] = [107, 67, 44];

export interface IndividualReportInput {
  bakery: Bakery;
  period: string;
  scores: VariableScores;
  previous?: VariableScores | null;
  sector?: VariableScores | null;
  snapshot?: IndicatorSnapshot | null;
  alerts: Alert[];
  recommendations: string[];
  anonymize?: boolean;
}

function header(doc: jsPDF, title: string): number {
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("ObservaPan", 14, 12);
  doc.setFontSize(9);
  doc.text("Observatorio Empresarial del Sector Panadero de Valledupar", 14, 19);
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(14);
  doc.text(title, 14, 38);
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text(`Generado: ${formatDate(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 44);
  doc.setTextColor(40, 40, 40);
  return 52;
}

export function generateIndividualReportPdf(input: IndividualReportInput): void {
  const doc = new jsPDF();
  const name = input.anonymize ? "Panadería (anonimizada)" : input.bakery.businessName;
  let y = header(doc, `Reporte individual · ${name}`);

  doc.setFontSize(10);
  doc.text(`Periodo evaluado: ${periodLabel(input.period)}`, 14, y);
  if (!input.anonymize) {
    doc.text(`Propietario: ${input.bakery.ownerName}`, 14, y + 6);
    doc.text(`Barrio: ${input.bakery.neighborhood ?? "—"}`, 14, y + 12);
    y += 12;
  }
  y += 10;

  const sb = (n: number | null) => (n === null ? "—" : n.toFixed(2));
  autoTable(doc, {
    startY: y,
    head: [["Variable", "Puntaje", "Interpretación", "Periodo anterior", "Promedio sector"]],
    body: (["productive", "administrative", "commercial", "global"] as const).map((k) => [
      variableLabel(k),
      sb(input.scores[k]),
      scoreInterpretation(input.scores[k]),
      sb(input.previous?.[k] ?? null),
      sb(input.sector?.[k] ?? null),
    ]),
    headStyles: { fillColor: BRAND },
    styles: { fontSize: 9 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 10;

  if (input.snapshot) {
    doc.setFontSize(10);
    doc.text(
      `Tendencia: ${trendLabel(input.snapshot.trend)}   ·   Nivel de riesgo: ${riskLabel(
        input.snapshot.riskLevel,
      )}`,
      14,
      y,
    );
    y += 8;
  }

  if (input.alerts.length) {
    doc.setFontSize(12);
    doc.text("Alertas", 14, y);
    autoTable(doc, {
      startY: y + 3,
      head: [["Severidad", "Título", "Descripción"]],
      body: input.alerts.map((a) => [a.severity, a.title, a.description]),
      headStyles: { fillColor: [220, 38, 38] },
      styles: { fontSize: 8 },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  if (input.recommendations.length) {
    doc.setFontSize(12);
    doc.text("Recomendaciones", 14, y);
    y += 6;
    doc.setFontSize(9);
    input.recommendations.forEach((r) => {
      const lines = doc.splitTextToSize(`• ${r}`, 180);
      doc.text(lines, 16, y);
      y += lines.length * 5 + 2;
    });
  }

  doc.save(`ObservaPan_${name.replace(/\s+/g, "_")}_${input.period}.pdf`);
}

export interface SectorReportInput {
  period: string;
  totalBakeries: number;
  sectorScores: VariableScores;
  weakest: string;
  strongest: string;
  problems: { label: string; count: number }[];
  conclusions: string[];
}

export function generateSectorReportPdf(input: SectorReportInput): void {
  const doc = new jsPDF();
  let y = header(doc, "Reporte sectorial");

  doc.setFontSize(10);
  doc.text(`Periodo: ${periodLabel(input.period)}`, 14, y);
  doc.text(`Panaderías evaluadas: ${input.totalBakeries}`, 14, y + 6);
  y += 16;

  const sb = (n: number | null) => (n === null ? "—" : n.toFixed(2));
  autoTable(doc, {
    startY: y,
    head: [["Variable", "Promedio sectorial", "Interpretación"]],
    body: (["productive", "administrative", "commercial", "global"] as const).map((k) => [
      variableLabel(k),
      sb(input.sectorScores[k]),
      scoreInterpretation(input.sectorScores[k]),
    ]),
    headStyles: { fillColor: BRAND },
    styles: { fontSize: 9 },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8;

  doc.setFontSize(10);
  doc.text(`Variable más débil: ${input.weakest}`, 14, y);
  doc.text(`Variable con mejor comportamiento: ${input.strongest}`, 14, y + 6);
  y += 16;

  if (input.problems.length) {
    doc.setFontSize(12);
    doc.text("Principales problemáticas", 14, y);
    autoTable(doc, {
      startY: y + 3,
      head: [["Problemática", "Frecuencia"]],
      body: input.problems.map((p) => [p.label, String(p.count)]),
      headStyles: { fillColor: BRAND },
      styles: { fontSize: 9 },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  if (input.conclusions.length) {
    doc.setFontSize(12);
    doc.text("Conclusiones", 14, y);
    y += 6;
    doc.setFontSize(9);
    input.conclusions.forEach((c) => {
      const lines = doc.splitTextToSize(`• ${c}`, 180);
      doc.text(lines, 16, y);
      y += lines.length * 5 + 2;
    });
  }

  doc.save(`ObservaPan_Sectorial_${input.period}.pdf`);
}
