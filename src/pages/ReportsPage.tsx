import { useMemo, useState } from "react";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card, CardHeader, CardBody, Button, Select, Input, LoadingSpinner, InlineAlert,
} from "@/components/ui";
import { ReportPreview } from "@/components/reports/ReportPreview";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";
import { listRecordsScoped, listBakeriesScoped, listSnapshotsScoped, listAlertsScoped } from "@/services/scopedData";
import { getConfig } from "@/services/configService";
import {
  sectorAverageFromRecords, rankProblems, weakestVariable, strongestVariable, sectorConclusions,
} from "@/services/reportService";
import { averageScores } from "@/utils/scoring";
import { buildRecommendations } from "@/services/diagnosticEngine";
import { generateIndividualReportPdf, generateSectorReportPdf } from "@/utils/exportPdf";
import { exportToExcel } from "@/utils/exportExcel";
import { logAudit } from "@/services/auditService";
import { variableLabel } from "@/utils/formatters";
import { canViewSectorReports, scopedBakeryIds } from "@/utils/permissions";
import { periodLabel } from "@/utils/dates";

export function ReportsPage() {
  const { user } = useAuth();
  const { data, loading, error } = useAsync(async () => {
    const [records, bakeries, snapshots, alerts, config] = await Promise.all([
      listRecordsScoped(user), listBakeriesScoped(user), listSnapshotsScoped(user), listAlertsScoped(user), getConfig(),
    ]);
    return { records: records.filter((r) => r.status === "completed"), bakeries, snapshots, alerts, config };
  }, [user]);

  const [mode, setMode] = useState<"individual" | "sector">("individual");
  const [bakeryId, setBakeryId] = useState("");
  const [period, setPeriod] = useState("");

  const scope = scopedBakeryIds(user);
  const sectorAllowed = canViewSectorReports(user);
  const bakeries = useMemo(() => (data?.bakeries ?? []).filter((b) => scope === null || scope.includes(b.id)), [data, scope]);
  const periods = useMemo(() => [...new Set((data?.records ?? []).map((r) => r.period))].sort().reverse(), [data]);

  if (loading) return <LoadingSpinner />;
  if (error) return <InlineAlert tone="error">{error}</InlineAlert>;
  if (!data) return null;

  const periodRecords = data.records.filter((r) => (!period || r.period === period) && (scope === null || scope.includes(r.bakeryId)));
  const sectorScores = sectorAverageFromRecords(periodRecords);

  const audit = (desc: string) =>
    logAudit({ userId: user!.uid, userEmail: user!.email, action: "generate_report", module: "reports", description: desc });

  const individualRecord = data.records
    .filter((r) => r.bakeryId === bakeryId && (!period || r.period === period))
    .sort((a, b) => b.period.localeCompare(a.period))[0];
  const bakery = data.bakeries.find((b) => b.id === bakeryId);

  const exportIndividualPdf = () => {
    if (!bakery || !individualRecord) return;
    const sector = averageScores(data.records.filter((r) => r.period === individualRecord.period).map((r) => r.scores));
    const snapshot = data.snapshots.find((s) => s.recordId === individualRecord.id) ?? null;
    const alerts = data.alerts.filter((a) => a.bakeryId === bakeryId && a.recordId === individualRecord.id);
    generateIndividualReportPdf({
      bakery, period: individualRecord.period, scores: individualRecord.scores,
      sector, snapshot, alerts, recommendations: buildRecommendations(individualRecord.scores),
    });
    audit(`Reporte individual PDF · ${bakery.businessName}`);
  };

  const exportSectorPdf = () => {
    generateSectorReportPdf({
      period: period || "todos",
      totalBakeries: new Set(periodRecords.map((r) => r.bakeryId)).size,
      sectorScores,
      weakest: variableLabel(weakestVariable(sectorScores)),
      strongest: variableLabel(strongestVariable(sectorScores)),
      problems: rankProblems(periodRecords),
      conclusions: sectorConclusions(sectorScores, periodRecords.length),
    });
    audit("Reporte sectorial PDF");
  };

  const exportExcel = () => {
    exportToExcel({
      bakeries: bakeries,
      records: periodRecords,
      indicators: data.snapshots.filter((s) => scope === null || scope.includes(s.bakeryId)),
      alerts: data.alerts.filter((a) => !a.bakeryId || scope === null || scope.includes(a.bakeryId)),
    }, `ObservaPan_Reporte_${period || "general"}`);
    audit("Exportó reporte a Excel");
  };

  return (
    <div>
      <PageHeader title="Reportes" subtitle="Genera y exporta reportes individuales y sectoriales" />
      <Card className="mb-4">
        <CardBody className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Select label="Tipo de reporte" value={mode} onChange={(e) => setMode(e.target.value as "individual" | "sector")}
            options={[
              { value: "individual", label: "Individual por panadería" },
              ...(sectorAllowed ? [{ value: "sector", label: "Sectorial" }] : []),
            ]} />
          {mode === "individual" && (
            <Select label="Panadería" placeholder="Selecciona" value={bakeryId} onChange={(e) => setBakeryId(e.target.value)}
              options={bakeries.map((b) => ({ value: b.id, label: b.businessName }))} />
          )}
          <Select label="Periodo" placeholder="Más reciente / todos" value={period} onChange={(e) => setPeriod(e.target.value)}
            options={periods.map((p) => ({ value: p, label: periodLabel(p) }))} />
        </CardBody>
      </Card>

      {mode === "individual" ? (
        bakery && individualRecord ? (
          <div className="space-y-4">
            <ReportPreview
              title={`Reporte individual · ${bakery.businessName}`}
              period={periodLabel(individualRecord.period)}
              scores={individualRecord.scores}
              notes={buildRecommendations(individualRecord.scores)}
            />
            <div className="flex gap-2">
              <Button onClick={exportIndividualPdf}><FileDown size={16} /> Exportar PDF</Button>
              <Button variant="secondary" onClick={exportExcel}><FileSpreadsheet size={16} /> Exportar Excel</Button>
            </div>
          </div>
        ) : (
          <Card><CardBody><InlineAlert tone="info">Selecciona una panadería con registros finalizados.</InlineAlert></CardBody></Card>
        )
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Reporte sectorial" subtitle={`${new Set(periodRecords.map((r) => r.bakeryId)).size} panadería(s) · ${period ? periodLabel(period) : "todos los periodos"}`} />
            <CardBody className="space-y-3">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {(["productive", "administrative", "commercial", "global"] as const).map((k) => (
                  <div key={k} className="rounded-lg border border-brand-50 p-3 text-center">
                    <p className="text-xs uppercase text-gray-500">{variableLabel(k)}</p>
                    <p className="text-xl font-bold text-brand-700">{sectorScores[k]?.toFixed(2) ?? "—"}</p>
                  </div>
                ))}
              </div>
              <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
                {sectorConclusions(sectorScores, periodRecords.length).map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </CardBody>
          </Card>
          <div className="flex gap-2">
            <Button onClick={exportSectorPdf}><FileDown size={16} /> Exportar PDF</Button>
            <Button variant="secondary" onClick={exportExcel}><FileSpreadsheet size={16} /> Exportar Excel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
