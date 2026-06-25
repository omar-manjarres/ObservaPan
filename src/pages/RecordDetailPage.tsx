import { useNavigate, useParams } from "react-router-dom";
import { FileDown, Pencil } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card, CardHeader, CardBody, Badge, Button, LoadingSpinner, EmptyState, InlineAlert,
} from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";
import { getRecord } from "@/services/recordService";
import { getBakery } from "@/services/bakeryService";
import { getForm } from "@/services/formService";
import { listAlertsByBakery } from "@/services/alertService";
import { buildRecommendations } from "@/services/diagnosticEngine";
import { generateIndividualReportPdf } from "@/utils/exportPdf";
import { logAudit } from "@/services/auditService";
import { variableLabel } from "@/utils/formatters";
import { periodLabel } from "@/utils/dates";
import { canEditRecord } from "@/utils/permissions";
import { VARIABLE_LABELS } from "@/constants/variables";
import { ROUTES } from "@/constants/routes";
import type { Variable } from "@/types";

export function RecordDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, loading, error } = useAsync(async () => {
    const record = await getRecord(id);
    if (!record) return { record: null };
    const [bakery, form, alerts] = await Promise.all([
      getBakery(record.bakeryId), getForm(record.formId), listAlertsByBakery(record.bakeryId),
    ]);
    return { record, bakery, form, alerts: alerts.filter((a) => a.recordId === id) };
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <InlineAlert tone="error">{error}</InlineAlert>;
  if (!data?.record) return <EmptyState title="Registro no encontrado" />;

  const { record, bakery, form, alerts = [] } = data;

  const exportPdf = () => {
    if (!bakery) return;
    generateIndividualReportPdf({
      bakery, period: record.period, scores: record.scores,
      alerts, recommendations: buildRecommendations(record.scores),
    });
    logAudit({ userId: user!.uid, userEmail: user!.email, action: "export", module: "records", documentId: id, description: "Exportó reporte individual de registro" });
  };

  const grouped = (["productive", "administrative", "commercial"] as Variable[]).map((v) => ({
    variable: v,
    responses: record.responses.filter((r) => r.variable === v),
  }));

  return (
    <div>
      <PageHeader
        title={`Diagnóstico · ${bakery?.businessName ?? ""}`}
        subtitle={`Periodo ${periodLabel(record.period)} · Formulario ${form?.name ?? ""} v${record.formVersion}`}
        action={
          <div className="flex gap-2">
            {canEditRecord(user, record.status) && record.status === "draft" && (
              <Button variant="outline" onClick={() => navigate(ROUTES.newRecord)}><Pencil size={15} /> Editar</Button>
            )}
            <Button onClick={exportPdf}><FileDown size={15} /> Exportar PDF</Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <Badge tone={record.status === "completed" ? "success" : "warning"}>
          {record.status === "completed" ? "Finalizado" : "Borrador"}
        </Badge>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {(["productive", "administrative", "commercial", "global"] as const).map((k) => (
          <Card key={k} className="p-4 text-center">
            <p className="text-xs uppercase text-gray-500">{variableLabel(k)}</p>
            <p className="text-2xl font-bold text-brand-700">{record.scores[k]?.toFixed(2) ?? "—"}</p>
          </Card>
        ))}
      </div>

      {grouped.map((g) => (
        <Card key={g.variable} className="mb-4">
          <CardHeader title={`Gestión ${VARIABLE_LABELS[g.variable].toLowerCase()}`} />
          <CardBody className="space-y-2">
            {g.responses.length === 0 ? (
              <p className="text-sm text-gray-500">Sin respuestas en esta variable.</p>
            ) : g.responses.map((r) => (
              <div key={r.questionId} className="flex items-start justify-between gap-3 border-b border-brand-50 pb-2 text-sm">
                <span className="text-gray-700">{r.questionText}</span>
                <span className="whitespace-nowrap font-medium text-gray-800">
                  {Array.isArray(r.value) ? r.value.join(", ") : String(r.value)}
                  {typeof r.score === "number" && <span className="ml-2 text-brand-500">({r.score.toFixed(1)})</span>}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>
      ))}

      {record.observations && (
        <Card className="mb-4">
          <CardHeader title="Observaciones" />
          <CardBody><p className="text-sm text-gray-600">{record.observations}</p></CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="Alertas derivadas" />
        <CardBody>
          {alerts.length ? (
            <ul className="space-y-2">
              {alerts.map((a) => (
                <li key={a.id} className="rounded-lg border border-brand-50 p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{a.title}</span>
                    <Badge tone={a.severity === "high" ? "critical" : a.severity === "medium" ? "warning" : "info"}>{a.severity}</Badge>
                  </div>
                  <p className="text-gray-500">{a.description}</p>
                  {a.recommendation && <p className="mt-1 text-xs text-brand-600">{a.recommendation}</p>}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-gray-500">No se generaron alertas para este registro.</p>}
        </CardBody>
      </Card>
    </div>
  );
}
