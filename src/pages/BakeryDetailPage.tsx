import { useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Pencil, FilePlus2, FileDown, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card, CardHeader, CardBody, Badge, Button, Table, THead, TBody, TH, TR, TD,
  LoadingSpinner, InlineAlert, EmptyState,
} from "@/components/ui";
import { TrendChart, type TrendPoint } from "@/components/dashboard/TrendChart";
import { RadarScoreChart } from "@/components/dashboard/RadarScoreChart";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";
import { getBakery } from "@/services/bakeryService";
import { listRecordsByBakery } from "@/services/recordService";
import { listSnapshotsByBakery } from "@/services/indicatorService";
import { listAlertsByBakery } from "@/services/alertService";
import { listCompletedByPeriod } from "@/services/recordService";
import { averageScores } from "@/utils/scoring";
import { canManageBakeries, canCreateRecords, canViewBakery } from "@/utils/permissions";
import { riskLabel, trendLabel, variableLabel } from "@/utils/formatters";
import { generateIndividualReportPdf } from "@/utils/exportPdf";
import { buildRecommendations } from "@/services/diagnosticEngine";
import { periodLabel } from "@/utils/dates";
import { ROUTES } from "@/constants/routes";
import { VARIABLE_COLORS } from "@/constants/variables";

export function BakeryDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, loading, error } = useAsync(async () => {
    const [bakery, records, snapshots, alerts] = await Promise.all([
      getBakery(id),
      listRecordsByBakery(id),
      listSnapshotsByBakery(id),
      listAlertsByBakery(id),
    ]);
    const lastCompleted = [...records].filter((r) => r.status === "completed").sort((a, b) => b.period.localeCompare(a.period))[0] ?? null;
    let sector = null;
    if (lastCompleted) {
      // Sector average requires reading all bakeries; bakery-role users cannot,
      // so degrade gracefully when the query is denied by security rules.
      try {
        const sectorRecords = await listCompletedByPeriod(lastCompleted.period);
        sector = averageScores(sectorRecords.map((r) => r.scores));
      } catch {
        sector = null;
      }
    }
    return { bakery, records, snapshots, alerts, lastCompleted, sector };
  }, [id]);

  const trend: TrendPoint[] = useMemo(() => {
    if (!data) return [];
    return [...data.snapshots]
      .sort((a, b) => a.period.localeCompare(b.period))
      .map((s) => ({
        period: s.period,
        productive: s.productiveScore,
        administrative: s.administrativeScore,
        commercial: s.commercialScore,
        global: s.globalScore,
      }));
  }, [data]);

  if (loading) return <LoadingSpinner />;
  if (error) return <InlineAlert tone="error">{error}</InlineAlert>;
  if (!data?.bakery) return <EmptyState title="Panadería no encontrada" />;
  if (!canViewBakery(user, id))
    return <EmptyState title="Acceso restringido" message="No puedes ver esta panadería." />;

  const { bakery, lastCompleted, sector, alerts } = data;
  const activeAlerts = alerts.filter((a) => a.status === "active");
  const lastSnapshot = [...data.snapshots].sort((a, b) => b.period.localeCompare(a.period))[0] ?? null;

  const exportReport = () => {
    if (!lastCompleted) return;
    generateIndividualReportPdf({
      bakery,
      period: lastCompleted.period,
      scores: lastCompleted.scores,
      previous: trend.length >= 2 ? {
        productive: trend[trend.length - 2].productive ?? null,
        administrative: trend[trend.length - 2].administrative ?? null,
        commercial: trend[trend.length - 2].commercial ?? null,
        global: trend[trend.length - 2].global ?? null,
      } : null,
      sector,
      snapshot: lastSnapshot,
      alerts: activeAlerts,
      recommendations: buildRecommendations(lastCompleted.scores),
    });
  };

  return (
    <div>
      <Link to={ROUTES.bakeries} className="mb-3 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft size={14} /> Volver a panaderías
      </Link>
      <PageHeader
        title={bakery.businessName}
        subtitle={`${bakery.ownerName} · ${[bakery.neighborhood, bakery.commune].filter(Boolean).join(" · ")}`}
        action={
          <div className="flex flex-wrap gap-2">
            {canManageBakeries(user) && (
              <Button variant="outline" onClick={() => navigate(ROUTES.editBakery(id))}>
                <Pencil size={15} /> Editar
              </Button>
            )}
            {canCreateRecords(user) && (
              <Button variant="secondary" onClick={() => navigate(`${ROUTES.newRecord}?bakery=${id}`)}>
                <FilePlus2 size={15} /> Nuevo diagnóstico
              </Button>
            )}
            <Button onClick={exportReport} disabled={!lastCompleted}>
              <FileDown size={15} /> Reporte PDF
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Información general" />
          <CardBody className="space-y-1 text-sm">
            <Info label="Estado" value={<Badge tone={bakery.status === "active" ? "success" : "neutral"}>{bakery.status === "active" ? "Activa" : "Inactiva"}</Badge>} />
            <Info label="NIT" value={bakery.nit ?? "—"} />
            <Info label="Teléfono" value={bakery.phone ?? "—"} />
            <Info label="Correo" value={bakery.email ?? "—"} />
            <Info label="Dirección" value={bakery.address ?? "—"} />
            <Info label="Empleados" value={bakery.employeeCount ?? "—"} />
            <Info label="Tamaño" value={bakery.companySize ?? "—"} />
            <Info label="Producción" value={bakery.productionType ?? "—"} />
            <Info label="Año inicio" value={bakery.startYear ?? "—"} />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Indicadores actuales"
            subtitle={lastCompleted ? `Último diagnóstico · ${periodLabel(lastCompleted.period)}` : "Sin diagnósticos"}
          />
          <CardBody>
            {lastCompleted ? (
              <>
                <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {(["productive", "administrative", "commercial", "global"] as const).map((k) => (
                    <div key={k} className="rounded-lg border border-brand-50 p-3 text-center">
                      <p className="text-xs uppercase text-gray-500">{variableLabel(k)}</p>
                      <p className="text-xl font-bold text-brand-700">{lastCompleted.scores[k]?.toFixed(2) ?? "—"}</p>
                    </div>
                  ))}
                </div>
                {lastSnapshot && (
                  <div className="flex gap-3 text-sm">
                    <Badge tone="info">Tendencia: {trendLabel(lastSnapshot.trend)}</Badge>
                    <Badge tone={lastSnapshot.riskLevel === "high" ? "critical" : lastSnapshot.riskLevel === "medium" ? "warning" : "success"}>
                      Riesgo: {riskLabel(lastSnapshot.riskLevel)}
                    </Badge>
                  </div>
                )}
              </>
            ) : (
              <EmptyState title="Sin diagnósticos" message="Registra el primer diagnóstico de esta panadería." />
            )}
          </CardBody>
        </Card>
      </div>

      {trend.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Evolución histórica" />
            <CardBody><TrendChart data={trend} /></CardBody>
          </Card>
          <Card>
            <CardHeader title="Comparación con el sector" />
            <CardBody>
              {lastCompleted && sector ? (
                <RadarScoreChart
                  series={[
                    { name: "Panadería", color: VARIABLE_COLORS.global, values: lastCompleted.scores },
                    { name: "Sector", color: VARIABLE_COLORS.commercial, values: sector },
                  ]}
                />
              ) : <p className="text-sm text-gray-500">Sin datos de comparación.</p>}
            </CardBody>
          </Card>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Historial de registros" />
          <CardBody className="p-0">
            {data.records.length ? (
              <Table>
                <THead><TR><TH>Periodo</TH><TH>Estado</TH><TH>Global</TH></TR></THead>
                <TBody>
                  {[...data.records].sort((a, b) => b.period.localeCompare(a.period)).map((r) => (
                    <TR key={r.id} onClick={() => navigate(ROUTES.recordDetail(r.id))}>
                      <TD>{periodLabel(r.period)}</TD>
                      <TD><Badge tone={r.status === "completed" ? "success" : "warning"}>{r.status === "completed" ? "Finalizado" : "Borrador"}</Badge></TD>
                      <TD>{r.scores.global?.toFixed(2) ?? "—"}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            ) : <EmptyState title="Sin registros" />}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Alertas activas" />
          <CardBody>
            {activeAlerts.length ? (
              <ul className="space-y-2">
                {activeAlerts.map((a) => (
                  <li key={a.id} className="rounded-lg border border-brand-50 p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{a.title}</span>
                      <Badge tone={a.severity === "high" ? "critical" : a.severity === "medium" ? "warning" : "info"}>{a.severity}</Badge>
                    </div>
                    <p className="text-gray-500">{a.description}</p>
                  </li>
                ))}
              </ul>
            ) : <EmptyState title="No se encontraron alertas activas." />}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-brand-50 py-1.5">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}
