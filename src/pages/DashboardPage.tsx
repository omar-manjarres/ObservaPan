import { useMemo } from "react";
import {
  Store, CheckCircle2, ClipboardList, CalendarClock, AlertTriangle,
  TrendingUp, TrendingDown,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { VariableScoreChart } from "@/components/dashboard/VariableScoreChart";
import { TrendChart, type TrendPoint } from "@/components/dashboard/TrendChart";
import { ProblemRanking } from "@/components/dashboard/ProblemRanking";
import { Card, CardHeader, CardBody, LoadingSpinner, InlineAlert, Badge } from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import {
  listBakeriesScoped,
  listRecordsScoped,
  listSnapshotsScoped,
  listAlertsScoped,
} from "@/services/scopedData";
import { averageScores } from "@/utils/scoring";
import { rankProblems } from "@/services/reportService";
import { scopedBakeryIds } from "@/utils/permissions";
import { periodLabel } from "@/utils/dates";
import { useAuth } from "@/hooks/useAuth";
import type { VariableScores } from "@/types";

export function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error } = useAsync(
    async () => {
      const [bakeries, records, snapshots, alerts] = await Promise.all([
        listBakeriesScoped(user),
        listRecordsScoped(user),
        listSnapshotsScoped(user),
        listAlertsScoped(user),
      ]);
      return { bakeries, records, snapshots, alerts };
    },
    [user],
  );

  const view = useMemo(() => {
    if (!data) return null;
    const scope = scopedBakeryIds(user);
    const inScope = (id: string) => scope === null || scope.includes(id);
    const bakeries = data.bakeries.filter((b) => inScope(b.id));
    const completed = data.records.filter((r) => r.status === "completed" && inScope(r.bakeryId));
    const alerts = data.alerts.filter((a) => a.status === "active" && (!a.bakeryId || inScope(a.bakeryId)));

    const periods = [...new Set(completed.map((r) => r.period))].sort();
    const lastPeriod = periods[periods.length - 1];
    const sector = averageScores(completed.map((r) => r.scores));

    const trend: TrendPoint[] = periods.map((p) => {
      const recs = completed.filter((r) => r.period === p);
      const avg = averageScores(recs.map((r) => r.scores));
      return { period: p, ...avg };
    });

    // improvement/decline ranking from snapshots
    const byBakeryGlobal = new Map<string, number[]>();
    [...data.snapshots]
      .filter((s) => inScope(s.bakeryId))
      .sort((a, b) => a.period.localeCompare(b.period))
      .forEach((s) => {
        if (s.globalScore === null) return;
        const arr = byBakeryGlobal.get(s.bakeryId) ?? [];
        arr.push(s.globalScore);
        byBakeryGlobal.set(s.bakeryId, arr);
      });
    const deltas = [...byBakeryGlobal.entries()]
      .filter(([, v]) => v.length >= 2)
      .map(([id, v]) => ({
        id,
        name: data.bakeries.find((b) => b.id === id)?.businessName ?? id,
        delta: +(v[v.length - 1] - v[0]).toFixed(2),
      }));
    const improvers = [...deltas].sort((a, b) => b.delta - a.delta).filter((d) => d.delta > 0).slice(0, 3);
    const decliners = [...deltas].sort((a, b) => a.delta - b.delta).filter((d) => d.delta < 0).slice(0, 3);

    return {
      total: bakeries.length,
      active: bakeries.filter((b) => b.status === "active").length,
      completedCount: completed.length,
      lastPeriod,
      sector,
      criticalAlerts: alerts.filter((a) => a.severity === "high").length,
      trend,
      problems: rankProblems(completed).slice(0, 5),
      improvers,
      decliners,
    };
  }, [data, user]);

  if (loading) return <LoadingSpinner label="Cargando dashboard..." />;
  if (error) return <InlineAlert tone="error">{error}</InlineAlert>;
  if (!view) return null;

  const sectorScores: VariableScores = view.sector;

  return (
    <div>
      <PageHeader
        title="Panel principal"
        subtitle="Visión general del sector panadero"
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Panaderías registradas" value={view.total} icon={<Store size={20} />} />
        <KpiCard label="Panaderías activas" value={view.active} tone="success" icon={<CheckCircle2 size={20} />} />
        <KpiCard label="Formularios diligenciados" value={view.completedCount} icon={<ClipboardList size={20} />} />
        <KpiCard
          label="Último periodo"
          value={view.lastPeriod ? periodLabel(view.lastPeriod) : "—"}
          icon={<CalendarClock size={20} />}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Prom. productiva" value={sectorScores.productive?.toFixed(2) ?? "—"} />
        <KpiCard label="Prom. administrativa" value={sectorScores.administrative?.toFixed(2) ?? "—"} />
        <KpiCard label="Prom. comercial" value={sectorScores.commercial?.toFixed(2) ?? "—"} />
        <KpiCard
          label="Alertas críticas"
          value={view.criticalAlerts}
          tone={view.criticalAlerts > 0 ? "critical" : "success"}
          icon={<AlertTriangle size={20} />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Evolución general por periodo" />
          <CardBody>
            {view.trend.length ? (
              <TrendChart data={view.trend} />
            ) : (
              <p className="text-sm text-gray-500">No hay registros para mostrar tendencia.</p>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Comparativa de variables" subtitle="Promedio sectorial" />
          <CardBody>
            <VariableScoreChart scores={sectorScores} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Problemáticas más frecuentes" />
          <CardBody><ProblemRanking problems={view.problems} /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Mayor mejora" />
          <CardBody>
            {view.improvers.length ? (
              <ul className="space-y-2 text-sm">
                {view.improvers.map((d) => (
                  <li key={d.id} className="flex items-center justify-between">
                    <span className="text-gray-700">{d.name}</span>
                    <Badge tone="success"><TrendingUp size={12} /> +{d.delta}</Badge>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-gray-500">Sin datos suficientes.</p>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Mayor retroceso" />
          <CardBody>
            {view.decliners.length ? (
              <ul className="space-y-2 text-sm">
                {view.decliners.map((d) => (
                  <li key={d.id} className="flex items-center justify-between">
                    <span className="text-gray-700">{d.name}</span>
                    <Badge tone="critical"><TrendingDown size={12} /> {d.delta}</Badge>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-gray-500">Sin datos suficientes.</p>}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
