import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card, CardBody, Table, THead, TBody, TH, TR, TD, Badge, Button, Modal, Input, Textarea,
  LoadingSpinner, EmptyState, InlineAlert,
} from "@/components/ui";
import { useForms } from "@/hooks/useForms";
import { useAuth } from "@/hooks/useAuth";
import { createForm, setFormStatus } from "@/services/formService";
import { logAudit } from "@/services/auditService";
import { formatDate } from "@/utils/dates";
import { ROUTES } from "@/constants/routes";
import type { DiagnosticForm, FormStatus } from "@/types";

const STATUS_TONE: Record<FormStatus, "success" | "neutral" | "warning"> = {
  active: "success", inactive: "neutral", draft: "warning",
};
const STATUS_LABEL: Record<FormStatus, string> = { active: "Activo", inactive: "Inactivo", draft: "Borrador" };

export function FormsPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useForms();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const create = async () => {
    if (!form.name) return;
    const id = await createForm({ name: form.name, description: form.description, variables: ["productive", "administrative", "commercial"] }, user!.uid);
    await logAudit({ userId: user!.uid, userEmail: user!.email, action: "create", module: "forms", documentId: id, description: `Creó formulario ${form.name}` });
    setOpen(false); navigate(ROUTES.editForm(id));
  };

  const cycleStatus = async (f: DiagnosticForm) => {
    const next: FormStatus = f.status === "active" ? "inactive" : "active";
    await setFormStatus(f.id, next);
    await logAudit({ userId: user!.uid, userEmail: user!.email, action: "update", module: "forms", documentId: f.id, description: `Formulario ${f.name} -> ${next}` });
    reload();
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <InlineAlert tone="error">{error}</InlineAlert>;

  return (
    <div>
      <PageHeader title="Formularios" subtitle="Diseña y administra los formularios de diagnóstico" action={<Button onClick={() => setOpen(true)}><Plus size={16} /> Nuevo formulario</Button>} />
      <Card>
        {(data?.length ?? 0) === 0 ? (
          <EmptyState title="Sin formularios" message="Crea el primer formulario de diagnóstico." />
        ) : (
          <Table>
            <THead><TR><TH>Nombre</TH><TH>Versión</TH><TH>Variables</TH><TH>Estado</TH><TH>Creado</TH><TH></TH></TR></THead>
            <TBody>
              {data!.map((f) => (
                <TR key={f.id}>
                  <TD className="font-medium text-brand-800">{f.name}</TD>
                  <TD>v{f.version}</TD>
                  <TD>{f.variables.length}</TD>
                  <TD><Badge tone={STATUS_TONE[f.status]}>{STATUS_LABEL[f.status]}</Badge></TD>
                  <TD>{formatDate(f.createdAt)}</TD>
                  <TD>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => navigate(ROUTES.editForm(f.id))}>Editar</Button>
                      <Button size="sm" variant="ghost" onClick={() => cycleStatus(f)}>{f.status === "active" ? "Desactivar" : "Activar"}</Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Modal open={open} title="Nuevo formulario" onClose={() => setOpen(false)}
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={create}>Crear</Button></>}>
        <div className="space-y-3">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Textarea label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
