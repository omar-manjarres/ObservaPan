import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card, CardBody, Table, THead, TBody, TH, TR, TD, Badge, Select,
  LoadingSpinner, EmptyState, InlineAlert,
} from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";
import { listSnapshotsScoped, listBakeriesScoped } from "@/services/scopedData";
import { riskLabel, trendLabel } from "@/utils/formatters";
import { scopedBakeryIds } from "@/utils/permissions";
import { periodLabel } from "@/utils/dates";

export function IndicatorsPage() {
  const { user } = useAuth();
  const { data, loading, error } = useAsync(async () => {
    const [snapshots, bakeries] = await Promise.all([listSnapshotsScoped(user), listBakeriesScoped(user)]);
    return { snapshots, bakeries };
  }, [user]);
  const [bakeryId, setBakeryId] = useState("");
  const [period, setPeriod] = useState("");

  const scope = scopedBakeryIds(user);
  const nameById = useMemo(() => new Map((data?.bakeries ?? []).map((b) => [b.id, b.businessName])), [data]);

  const rows = useMemo(() => {
    if (!data) return [];
    return data.snapshots
      .filter((s) => scope === null || scope.includes(s.bakeryId))
      .filter((s) => !bakeryId || s.bakeryId === bakeryId)
      .filter((s) => !period || s.period === period);
  }, [data, bakeryId, period, scope]);

  const periods = useMemo(() => [...new Set((data?.snapshots ?? []).map((s) => s.period))].sort().reverse(), [data]);

  if (loading) return <LoadingSpinner />;
  if (error) return <InlineAlert tone="error">{error}</InlineAlert>;

  return (
    <div>
      <PageHeader title="Indicadores" subtitle="Puntajes, tendencias y nivel de riesgo por panadería" />
      <Card className="mb-4">
        <CardBody className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Select placeholder="Todas las panaderías" value={bakeryId} onChange={(e) => setBakeryId(e.target.value)}
            options={[...nameById.entries()].map(([id, n]) => ({ value: id, label: n }))} />
          <Select placeholder="Todos los periodos" value={period} onChange={(e) => setPeriod(e.target.value)}
            options={periods.map((p) => ({ value: p, label: periodLabel(p) }))} />
        </CardBody>
      </Card>
      <Card>
        {rows.length === 0 ? (
          <EmptyState title="Sin indicadores" message="Aún no hay indicadores calculados." />
        ) : (
          <Table>
            <THead><TR>
              <TH>Panadería</TH><TH>Periodo</TH><TH>Prod.</TH><TH>Admin.</TH><TH>Com.</TH>
              <TH>Global</TH><TH>Tendencia</TH><TH>Riesgo</TH>
            </TR></THead>
            <TBody>
              {rows.map((s) => (
                <TR key={s.id}>
                  <TD className="font-medium text-brand-800">{nameById.get(s.bakeryId) ?? s.bakeryId}</TD>
                  <TD>{periodLabel(s.period)}</TD>
                  <TD>{s.productiveScore?.toFixed(2) ?? "—"}</TD>
                  <TD>{s.administrativeScore?.toFixed(2) ?? "—"}</TD>
                  <TD>{s.commercialScore?.toFixed(2) ?? "—"}</TD>
                  <TD className="font-semibold">{s.globalScore?.toFixed(2) ?? "—"}</TD>
                  <TD><Badge tone={s.trend === "improvement" ? "success" : s.trend === "decline" ? "critical" : "neutral"}>{trendLabel(s.trend)}</Badge></TD>
                  <TD><Badge tone={s.riskLevel === "high" ? "critical" : s.riskLevel === "medium" ? "warning" : "success"}>{riskLabel(s.riskLevel)}</Badge></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
