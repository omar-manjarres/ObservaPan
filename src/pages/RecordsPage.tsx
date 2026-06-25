import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card, CardBody, Table, THead, TBody, TH, TR, TD, Badge, Button, Select,
  LoadingSpinner, EmptyState, InlineAlert,
} from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";
import { listRecordsScoped, listBakeriesScoped } from "@/services/scopedData";
import { canCreateRecords, scopedBakeryIds } from "@/utils/permissions";
import { periodLabel } from "@/utils/dates";
import { ROUTES } from "@/constants/routes";

export function RecordsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error } = useAsync(async () => {
    const [records, bakeries] = await Promise.all([listRecordsScoped(user), listBakeriesScoped(user)]);
    return { records, bakeries };
  }, [user]);

  const [bakeryId, setBakeryId] = useState("");
  const [period, setPeriod] = useState("");
  const [status, setStatus] = useState("");

  const scope = scopedBakeryIds(user);
  const nameById = useMemo(
    () => new Map((data?.bakeries ?? []).map((b) => [b.id, b.businessName])),
    [data],
  );

  const rows = useMemo(() => {
    if (!data) return [];
    return data.records
      .filter((r) => scope === null || scope.includes(r.bakeryId))
      .filter((r) => !bakeryId || r.bakeryId === bakeryId)
      .filter((r) => !period || r.period === period)
      .filter((r) => !status || r.status === status);
  }, [data, bakeryId, period, status, scope]);

  const periods = useMemo(
    () => [...new Set((data?.records ?? []).map((r) => r.period))].sort().reverse(),
    [data],
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <InlineAlert tone="error">{error}</InlineAlert>;

  return (
    <div>
      <PageHeader
        title="Historial de registros"
        subtitle={`${rows.length} registro(s)`}
        action={canCreateRecords(user) && (
          <Button onClick={() => navigate(ROUTES.newRecord)}><Plus size={16} /> Nuevo registro</Button>
        )}
      />
      <Card className="mb-4">
        <CardBody className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Select placeholder="Todas las panaderías" value={bakeryId} onChange={(e) => setBakeryId(e.target.value)}
            options={[...nameById.entries()].map(([id, n]) => ({ value: id, label: n }))} />
          <Select placeholder="Todos los periodos" value={period} onChange={(e) => setPeriod(e.target.value)}
            options={periods.map((p) => ({ value: p, label: periodLabel(p) }))} />
          <Select placeholder="Todos los estados" value={status} onChange={(e) => setStatus(e.target.value)}
            options={[{ value: "draft", label: "Borrador" }, { value: "completed", label: "Finalizado" }]} />
        </CardBody>
      </Card>
      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No hay registros para este periodo" />
        ) : (
          <Table>
            <THead><TR>
              <TH>Panadería</TH><TH>Periodo</TH><TH>Estado</TH>
              <TH>Prod.</TH><TH>Admin.</TH><TH>Com.</TH><TH>Global</TH>
            </TR></THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.id} onClick={() => navigate(ROUTES.recordDetail(r.id))}>
                  <TD className="font-medium text-brand-800">{nameById.get(r.bakeryId) ?? r.bakeryId}</TD>
                  <TD>{periodLabel(r.period)}</TD>
                  <TD><Badge tone={r.status === "completed" ? "success" : "warning"}>{r.status === "completed" ? "Finalizado" : "Borrador"}</Badge></TD>
                  <TD>{r.scores.productive?.toFixed(2) ?? "—"}</TD>
                  <TD>{r.scores.administrative?.toFixed(2) ?? "—"}</TD>
                  <TD>{r.scores.commercial?.toFixed(2) ?? "—"}</TD>
                  <TD className="font-semibold">{r.scores.global?.toFixed(2) ?? "—"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
