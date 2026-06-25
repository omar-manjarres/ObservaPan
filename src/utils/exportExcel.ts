import * as XLSX from "xlsx";
import type {
  Bakery,
  DiagnosticRecord,
  IndicatorSnapshot,
  Alert,
} from "@/types";
import { riskLabel, trendLabel } from "./formatters";
import { formatDate } from "./dates";

export interface ExcelData {
  bakeries?: Bakery[];
  records?: DiagnosticRecord[];
  indicators?: IndicatorSnapshot[];
  alerts?: Alert[];
}

export function exportToExcel(data: ExcelData, fileName: string): void {
  const wb = XLSX.utils.book_new();

  if (data.bakeries) {
    const rows = data.bakeries.map((b) => ({
      Panadería: b.businessName,
      Propietario: b.ownerName,
      Barrio: b.neighborhood ?? "",
      Comuna: b.commune ?? "",
      Empleados: b.employeeCount ?? "",
      Tamaño: b.companySize ?? "",
      Producción: b.productionType ?? "",
      Estado: b.status,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Panaderías");
  }

  if (data.records) {
    const rows = data.records.map((r) => ({
      Panadería: r.bakeryId,
      Periodo: r.period,
      Estado: r.status,
      Productiva: r.scores.productive ?? "",
      Administrativa: r.scores.administrative ?? "",
      Comercial: r.scores.commercial ?? "",
      Global: r.scores.global ?? "",
      Creado: formatDate(r.createdAt),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Registros");
  }

  if (data.indicators) {
    const rows = data.indicators.map((i) => ({
      Panadería: i.bakeryId,
      Periodo: i.period,
      Productiva: i.productiveScore ?? "",
      Administrativa: i.administrativeScore ?? "",
      Comercial: i.commercialScore ?? "",
      Global: i.globalScore ?? "",
      Tendencia: trendLabel(i.trend),
      Riesgo: riskLabel(i.riskLevel),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Indicadores");
  }

  if (data.alerts) {
    const rows = data.alerts.map((a) => ({
      Título: a.title,
      Severidad: a.severity,
      Variable: a.variable ?? "",
      Estado: a.status,
      Descripción: a.description,
      Recomendación: a.recommendation ?? "",
      Creada: formatDate(a.createdAt),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Alertas");
  }

  if (wb.SheetNames.length === 0) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([["Sin datos"]]),
      "Reporte",
    );
  }

  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
