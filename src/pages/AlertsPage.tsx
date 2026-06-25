import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card, CardBody, Badge, Button, Select, LoadingSpinner, EmptyState, InlineAlert,
} from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";
import { setAlertStatus } from "@/services/alertService";
import { listAlertsScoped, listBakeriesScoped } from "@/services/scopedData";
import { scopedBakeryIds } from "@/utils/permissions";
import { formatDate } from "@/utils/dates";
import { hasRole } from "@/utils/permissions";
import type { Alert } from "@/types";

export function AlertsPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(async () => {
    const [alerts, bakeries] = await Promise.all([listAlertsScoped(user), listBakeriesScoped(user)]);
    return { alerts, bakeries };
  }, [user]);
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("active");

  const scope = scopedBakeryIds(user);
  const nameById = useMemo(() => new Map((data?.bakeries ?? []).map((b) => [b.id, b.businessName])), [data]);

  const rows = useMemo(() => {
    if (!data) return [];
    return data.alerts
      .filter((a) => !a.bakeryId || scope === null || scope.includes(a.bakeryId))
      .filter((a) => !severity || a.severity === severity)
      .filter((a) => !status || a.status === status);
  }, [data, severity, status, scope]);

  const change = async (a: Alert, s: Alert["status"]) => { await setAlertStatus(a.id, s); reload(); };

  if (loading) return <LoadingSpinner />;
  if (error) return <InlineAlert tone="error">{error}</InlineAlert>;

  const canManage = hasRole(user, "admin", "surveyor");

  return (
    <div>
      <PageHeader title="Alertas" subtitle="Seguimiento de alertas críticas, medias e informativas" />
      <Card className="mb-4">
        <CardBody className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Select placeholder="Todas las severidades" value={severity} onChange={(e) => setSeverity(e.target.value)}
            options={[{ value: "high", label: "Alta (crítica)" }, { value: "medium", label: "Media" }, { value: "low", label: "Baja / informativa" }]} />
          <Select value={status} onChange={(e) => setStatus(e.target.value)}
            options={[{ value: "active", label: "Activas" }, { value: "reviewed", label: "Revisadas" }, { value: "closed", label: "Cerradas" }, { value: "", label: "Todas" }]} />
        </CardBody>
      </Card>
      {rows.length === 0 ? (
        <Card><EmptyState title="No se encontraron alertas activas." /></Card>
      ) : (
        <div className="space-y-3">
          {rows.map((a) => (
            <Card key={a.id}>
              <CardBody className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={a.severity === "high" ? "critical" : a.severity === "medium" ? "warning" : "info"}>
                      {a.severity === "high" ? "Crítica" : a.severity === "medium" ? "Media" : "Informativa"}
                    </Badge>
                    <span className="font-semibold text-gray-800">{a.title}</span>
                    {a.bakeryId && <Badge tone="brand">{nameById.get(a.bakeryId) ?? "Panadería"}</Badge>}
                    <Badge tone="neutral">{a.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{a.description}</p>
                  {a.recommendation && <p className="text-xs text-brand-600">Recomendación: {a.recommendation}</p>}
                  <p className="text-xs text-gray-400">Generada: {formatDate(a.createdAt)}</p>
                </div>
                {canManage && a.status !== "closed" && (
                  <div className="flex gap-2">
                    {a.status === "active" && <Button size="sm" variant="outline" onClick={() => change(a, "reviewed")}>Revisada</Button>}
                    <Button size="sm" variant="ghost" onClick={() => change(a, "closed")}>Cerrar</Button>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
