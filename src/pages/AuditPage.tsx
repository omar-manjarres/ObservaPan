import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card, CardBody, Table, THead, TBody, TH, TR, TD, Badge, Select,
  LoadingSpinner, EmptyState, InlineAlert,
} from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { listAuditLogs } from "@/services/auditService";
import { formatDateTime } from "@/utils/dates";
import type { AuditAction } from "@/types";

const ACTION_LABEL: Record<AuditAction, string> = {
  create: "Crear", update: "Editar", delete: "Eliminar", deactivate: "Desactivar",
  login: "Inicio de sesión", export: "Exportar", generate_report: "Generar reporte",
};

export function AuditPage() {
  const { data, loading, error } = useAsync(() => listAuditLogs(300), []);
  const [action, setAction] = useState("");
  const [module, setModule] = useState("");

  const rows = useMemo(() => {
    if (!data) return [];
    return data.filter((l) => !action || l.action === action).filter((l) => !module || l.module === module);
  }, [data, action, module]);

  const modules = useMemo(() => [...new Set((data ?? []).map((l) => l.module))], [data]);

  if (loading) return <LoadingSpinner />;
  if (error) return <InlineAlert tone="error">{error}</InlineAlert>;

  return (
    <div>
      <PageHeader title="Auditoría" subtitle="Trazabilidad de acciones del sistema" />
      <Card className="mb-4">
        <CardBody className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Select placeholder="Todas las acciones" value={action} onChange={(e) => setAction(e.target.value)}
            options={(Object.keys(ACTION_LABEL) as AuditAction[]).map((a) => ({ value: a, label: ACTION_LABEL[a] }))} />
          <Select placeholder="Todos los módulos" value={module} onChange={(e) => setModule(e.target.value)}
            options={modules.map((m) => ({ value: m, label: m }))} />
        </CardBody>
      </Card>
      <Card>
        {rows.length === 0 ? <EmptyState title="Sin registros de auditoría" /> : (
          <Table>
            <THead><TR><TH>Fecha</TH><TH>Usuario</TH><TH>Acción</TH><TH>Módulo</TH><TH>Detalle</TH></TR></THead>
            <TBody>
              {rows.map((l) => (
                <TR key={l.id}>
                  <TD className="whitespace-nowrap">{formatDateTime(l.createdAt)}</TD>
                  <TD>{l.userEmail}</TD>
                  <TD><Badge tone="brand">{ACTION_LABEL[l.action]}</Badge></TD>
                  <TD>{l.module}</TD>
                  <TD>{l.description}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
