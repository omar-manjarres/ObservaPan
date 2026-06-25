import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Plus, ArrowLeft, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card, CardHeader, CardBody, Button, Modal, Input, Textarea, Select, Badge,
  LoadingSpinner, EmptyState, InlineAlert,
} from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";
import {
  getFullForm, saveSection, saveQuestion, setFormStatus, updateForm,
} from "@/services/formService";
import { logAudit } from "@/services/auditService";
import { VARIABLE_LABELS } from "@/constants/variables";
import { ROUTES } from "@/constants/routes";
import type { Variable, QuestionType, Direction } from "@/types";

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "frequency_scale", label: "Escala de frecuencia" },
  { value: "likert", label: "Escala Likert" },
  { value: "yes_no", label: "Sí / No" },
  { value: "single_choice", label: "Selección única" },
  { value: "multiple_choice", label: "Selección múltiple" },
  { value: "short_text", label: "Texto corto" },
  { value: "long_text", label: "Texto largo" },
  { value: "number", label: "Número" },
  { value: "date", label: "Fecha" },
];

export function FormBuilderPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() => getFullForm(id), [id]);

  const [secOpen, setSecOpen] = useState(false);
  const [sec, setSec] = useState({ title: "", variable: "productive" as Variable, description: "" });
  const [qOpen, setQOpen] = useState(false);
  const [q, setQ] = useState({
    sectionId: "", text: "", helpText: "", type: "frequency_scale" as QuestionType,
    direction: "positive" as Direction, required: true, affectsScore: true, weight: 1, options: "",
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <InlineAlert tone="error">{error}</InlineAlert>;
  if (!data) return <EmptyState title="Formulario no encontrado" />;

  const { form, sections, questions } = data;

  const addSection = async () => {
    if (!sec.title) return;
    await saveSection(id, { title: sec.title, variable: sec.variable, description: sec.description, order: sections.length + 1 });
    setSecOpen(false); setSec({ title: "", variable: "productive", description: "" }); reload();
  };

  const addQuestion = async () => {
    if (!q.sectionId || !q.text) return;
    const section = sections.find((s) => s.id === q.sectionId);
    const orderInSection = questions.filter((x) => x.sectionId === q.sectionId).length + 1;
    await saveQuestion(id, {
      sectionId: q.sectionId, text: q.text, helpText: q.helpText || undefined,
      variable: section?.variable ?? "productive", type: q.type,
      options: ["single_choice", "multiple_choice"].includes(q.type) ? q.options.split(",").map((o) => o.trim()).filter(Boolean) : undefined,
      required: q.required, order: orderInSection, affectsScore: q.affectsScore,
      direction: q.direction, weight: Number(q.weight) || 1, status: "active",
    });
    setQOpen(false);
    setQ({ ...q, text: "", helpText: "", options: "" });
    reload();
  };

  const activate = async () => {
    await updateForm(id, { version: form.version });
    await setFormStatus(id, "active");
    await logAudit({ userId: user!.uid, userEmail: user!.email, action: "update", module: "forms", documentId: id, description: `Activó formulario ${form.name}` });
    reload();
  };

  return (
    <div>
      <Link to={ROUTES.forms} className="mb-3 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"><ArrowLeft size={14} /> Volver a formularios</Link>
      <PageHeader title={form.name} subtitle={`v${form.version} · ${form.status}`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setSecOpen(true)}><Plus size={16} /> Sección</Button>
            <Button variant="secondary" onClick={() => { setQ({ ...q, sectionId: sections[0]?.id ?? "" }); setQOpen(true); }} disabled={sections.length === 0}><Plus size={16} /> Pregunta</Button>
            {form.status !== "active" && <Button onClick={activate}><CheckCircle2 size={16} /> Activar</Button>}
          </div>
        } />

      {sections.length === 0 ? (
        <Card><EmptyState title="Sin secciones" message="Agrega secciones por variable (productiva, administrativa, comercial)." /></Card>
      ) : (
        <div className="space-y-4">
          {[...sections].sort((a, b) => a.order - b.order).map((s) => (
            <Card key={s.id}>
              <CardHeader title={s.title} subtitle={`Variable ${VARIABLE_LABELS[s.variable]}`} />
              <CardBody className="space-y-2">
                {questions.filter((qq) => qq.sectionId === s.id).sort((a, b) => a.order - b.order).map((qq) => (
                  <div key={qq.id} className="flex items-start justify-between gap-2 border-b border-brand-50 pb-2 text-sm">
                    <span className="text-gray-700">{qq.text}</span>
                    <div className="flex flex-shrink-0 gap-1">
                      <Badge tone="neutral">{QUESTION_TYPES.find((t) => t.value === qq.type)?.label}</Badge>
                      <Badge tone={qq.direction === "positive" ? "success" : qq.direction === "negative" ? "critical" : "neutral"}>{qq.direction}</Badge>
                      {qq.required && <Badge tone="warning">obligatoria</Badge>}
                    </div>
                  </div>
                ))}
                {questions.filter((qq) => qq.sectionId === s.id).length === 0 && <p className="text-sm text-gray-400">Sin preguntas aún.</p>}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={secOpen} title="Nueva sección" onClose={() => setSecOpen(false)}
        footer={<><Button variant="outline" onClick={() => setSecOpen(false)}>Cancelar</Button><Button onClick={addSection}>Agregar</Button></>}>
        <div className="space-y-3">
          <Input label="Título" value={sec.title} onChange={(e) => setSec({ ...sec, title: e.target.value })} />
          <Select label="Variable" value={sec.variable} onChange={(e) => setSec({ ...sec, variable: e.target.value as Variable })}
            options={(["productive", "administrative", "commercial"] as Variable[]).map((v) => ({ value: v, label: VARIABLE_LABELS[v] }))} />
          <Textarea label="Descripción" value={sec.description} onChange={(e) => setSec({ ...sec, description: e.target.value })} />
        </div>
      </Modal>

      <Modal open={qOpen} title="Nueva pregunta" onClose={() => setQOpen(false)}
        footer={<><Button variant="outline" onClick={() => setQOpen(false)}>Cancelar</Button><Button onClick={addQuestion}>Agregar</Button></>}>
        <div className="space-y-3">
          <Select label="Sección" value={q.sectionId} onChange={(e) => setQ({ ...q, sectionId: e.target.value })}
            options={sections.map((s) => ({ value: s.id, label: s.title }))} />
          <Textarea label="Texto de la pregunta" value={q.text} onChange={(e) => setQ({ ...q, text: e.target.value })} />
          <Input label="Texto de ayuda (opcional)" value={q.helpText} onChange={(e) => setQ({ ...q, helpText: e.target.value })} />
          <Select label="Tipo" value={q.type} onChange={(e) => setQ({ ...q, type: e.target.value as QuestionType })} options={QUESTION_TYPES} />
          {["single_choice", "multiple_choice"].includes(q.type) && (
            <Input label="Opciones (separadas por coma)" value={q.options} onChange={(e) => setQ({ ...q, options: e.target.value })} />
          )}
          <Select label="Dirección" value={q.direction} onChange={(e) => setQ({ ...q, direction: e.target.value as Direction })}
            options={[{ value: "positive", label: "Positiva" }, { value: "negative", label: "Negativa" }, { value: "neutral", label: "Neutral" }]} />
          <Input label="Peso" type="number" value={q.weight} onChange={(e) => setQ({ ...q, weight: Number(e.target.value) })} />
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={q.required} onChange={(e) => setQ({ ...q, required: e.target.checked })} /> Obligatoria</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={q.affectsScore} onChange={(e) => setQ({ ...q, affectsScore: e.target.checked })} /> Afecta puntaje</label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
