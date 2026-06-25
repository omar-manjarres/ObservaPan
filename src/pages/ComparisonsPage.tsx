import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card, CardHeader, CardBody, Select, LoadingSpinner, EmptyState, InlineAlert, Badge,
} from "@/components/ui";
import { TrendChart, type TrendPoint } from "@/components/dashboard/TrendChart";
import { RadarScoreChart } from "@/components/dashboard/RadarScoreChart";
import { VariableScoreChart } from "@/components/dashboard/VariableScoreChart";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";
import { listRecordsScoped, listBakeriesScoped } from "@/services/scopedData";
import { averageScores } from "@/utils/scoring";
import { scopedBakeryIds } from "@/utils/permissions";
import { periodLabel } from "@/utils/dates";
import { VARIABLE_COLORS } from "@/constants/variables";
import type { VariableScores } from "@/types";

export function ComparisonsPage() {
  const { user } = useAuth();
  const { data, loading, error } = useAsync(async () => {
    const [records, bakeries] = await Promise.all([listRecordsScoped(user), listBakeriesScoped(user)]);
    return { records: records.filter((r) => r.status === "completed"), bakeries };
  }, [user]);
  const [bakeryId, setBakeryId] = useState("");

  const scope = scopedBakeryIds(user);
  const bakeries = useMemo(() => (data?.bakeries ?? []).filter((b) => scope === null || scope.includes(b.id)), [data, scope]);
  const nameById = useMemo(() => new Map((data?.bakeries ?? []).map((b) => [b.id, b.businessName])), [data]);

  const view = useMemo(() => {
    if (!data || !bakeryId) return null;
    const own = data.records.filter((r) => r.bakeryId === bakeryId).sort((a, b) => a.period.localeCompare(b.period));
    const trend: TrendPoint[] = own.map((r) => ({ period: r.period, ...r.scores }));
    const last = own[own.length - 1] ?? null;
    const prev = own[own.length - 2] ?? null;
    const sector: VariableScores | null = last
      ? averageScores(data.records.filter((r) => r.period === last.period).map((r) => r.scores))
      : null;
    return { own, trend, last, prev, sector };
  }, [data, bakeryId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <InlineAlert tone="error">{error}</InlineAlert>;

  return (
    <div>
      <PageHeader title="Comparaciones" subtitle="Histórico propio, comparación con el sector y entre periodos" />
      <Card className="mb-4">
        <CardBody>
          <Select label="Panadería a analizar" placeholder="Selecciona panadería" value={bakeryId} onChange={(e) => setBakeryId(e.target.value)}
            options={bakeries.map((b) => ({ value: b.id, label: b.businessName }))} />
        </CardBody>
      </Card>

      {!bakeryId && <Card><EmptyState title="Selecciona una panadería para comparar." /></Card>}

      {view && view.last && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title={`Evolución de ${nameById.get(bakeryId)}`} />
              <CardBody>
                {view.trend.length ? <TrendChart data={view.trend} /> : <p className="text-sm text-gray-500">Sin histórico.</p>}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Panadería vs promedio sectorial" subtitle={periodLabel(view.last.period)} />
              <CardBody>
                {view.sector && (
                  <RadarScoreChart series={[
                    { name: "Panadería", color: VARIABLE_COLORS.global, values: view.last.scores },
                    { name: "Sector", color: VARIABLE_COLORS.commercial, values: view.sector },
                  ]} />
                )}
              </CardBody>
            </Card>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Variables del último periodo" />
              <CardBody><VariableScoreChart scores={view.last.scores} /></CardBody>
            </Card>
            <Card>
              <CardHeader title="Periodo actual vs anterior" />
              <CardBody>
                {view.prev ? (
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-gray-500"><th className="py-1">Variable</th><th>Anterior</th><th>Actual</th><th>Δ</th></tr></thead>
                    <tbody>
                      {(["productive", "administrative", "commercial", "global"] as const).map((k) => {
                        const a = view.prev!.scores[k]; const c = view.last!.scores[k];
                        const d = a !== null && c !== null ? +(c - a).toFixed(2) : null;
                        return (
                          <tr key={k} className="border-t border-brand-50">
                            <td className="py-1.5 capitalize">{k === "global" ? "Global" : k}</td>
                            <td>{a?.toFixed(2) ?? "—"}</td>
                            <td>{c?.toFixed(2) ?? "—"}</td>
                            <td>{d === null ? "—" : <Badge tone={d > 0 ? "success" : d < 0 ? "critical" : "neutral"}>{d > 0 ? "+" : ""}{d}</Badge>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : <p className="text-sm text-gray-500">No hay un periodo anterior para comparar.</p>}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
