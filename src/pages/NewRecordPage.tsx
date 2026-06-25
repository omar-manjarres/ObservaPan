import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Save, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card, CardBody, Button, Select, Input, Textarea, LoadingSpinner, InlineAlert,
} from "@/components/ui";
import { DynamicFormRenderer } from "@/components/forms/DynamicFormRenderer";
import { useAuth } from "@/hooks/useAuth";
import { useAsync } from "@/hooks/useAsync";
import { listActiveForms, getFullForm } from "@/services/formService";
import { listBakeriesScoped } from "@/services/scopedData";
import { createRecord, listRecordsByBakery, previousRecord, listCompletedByPeriod } from "@/services/recordService";
import { getBakery } from "@/services/bakeryService";
import { getConfig } from "@/services/configService";
import { processCompletedRecord } from "@/services/diagnosticEngine";
import { logAudit } from "@/services/auditService";
import { buildScoredResponses, calculateScores, averageScores } from "@/utils/scoring";
import { canCreateRecords, scopedBakeryIds } from "@/utils/permissions";
import { currentPeriod } from "@/utils/dates";
import { ROUTES } from "@/constants/routes";
import type { FullForm, ResponseValue, RecordStatus } from "@/types";

export function NewRecordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const { data, loading } = useAsync(async () => {
    const [bakeries, forms] = await Promise.all([listBakeriesScoped(user), listActiveForms()]);
    return { bakeries, forms };
  }, [user]);

  const [bakeryId, setBakeryId] = useState(params.get("bakery") ?? "");
  const [formId, setFormId] = useState("");
  const [period, setPeriod] = useState(currentPeriod());
  const [fullForm, setFullForm] = useState<FullForm | null>(null);
  const [answers, setAnswers] = useState<Record<string, ResponseValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);

  const scope = scopedBakeryIds(user);
  const bakeries = useMemo(
    () => (data?.bakeries ?? []).filter((b) => scope === null || scope.includes(b.id)),
    [data, scope],
  );

  useEffect(() => {
    if (data && !formId && data.forms.length === 1) setFormId(data.forms[0].id);
  }, [data, formId]);

  useEffect(() => {
    if (!formId) { setFullForm(null); return; }
    getFullForm(formId).then(setFullForm);
  }, [formId]);

  const liveScores = useMemo(() => {
    if (!fullForm) return null;
    const responses = buildScoredResponses(fullForm.questions, answers);
    return calculateScores(responses, fullForm.questions);
  }, [fullForm, answers]);

  if (!canCreateRecords(user))
    return <InlineAlert tone="error">No tienes permisos para registrar información.</InlineAlert>;
  if (loading) return <LoadingSpinner />;

  const isEmpty = (v: ResponseValue | undefined) =>
    v === undefined || v === "" || (Array.isArray(v) && v.length === 0);

  const validate = (): number => {
    if (!fullForm) return -1;
    const errs: Record<string, string> = {};
    let firstMissing = "";
    for (const q of fullForm.questions) {
      if (q.required && isEmpty(answers[q.id])) {
        errs[q.id] = "Este campo es obligatorio.";
        if (!firstMissing) firstMissing = q.id;
      }
    }
    setErrors(errs);
    if (firstMissing) {
      document
        .getElementById(`q-${firstMissing}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return Object.keys(errs).length;
  };

  const save = async (status: RecordStatus) => {
    setFormMsg(null);
    if (!bakeryId || !formId) { setFormMsg("Selecciona panadería y formulario."); return; }
    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      setFormMsg("Ingresa un periodo válido con el formato YYYY-MM (por ejemplo 2026-06).");
      return;
    }
    if (status === "completed") {
      const missing = validate();
      if (missing > 0) {
        setFormMsg(
          `El formulario tiene ${missing} campo(s) obligatorio(s) pendiente(s). Te llevé al primero que falta.`,
        );
        return;
      }
    }
    if (!fullForm) return;
    setSaving(true);
    try {
      const responses = buildScoredResponses(fullForm.questions, answers);
      const scores = calculateScores(responses, fullForm.questions);
      const recordId = await createRecord({
        bakeryId, formId, formVersion: fullForm.form.version, period,
        periodType: "monthly", status, responses, scores,
        observations: (answers["__observations"] as string) ?? undefined,
        createdBy: user!.uid,
      });
      await logAudit({
        userId: user!.uid, userEmail: user!.email, action: "create", module: "records",
        documentId: recordId, description: `Registró diagnóstico (${status}) periodo ${period}`,
      });

      if (status === "completed") {
        const [bakery, history, config] = await Promise.all([
          getBakery(bakeryId), listRecordsByBakery(bakeryId), getConfig(),
        ]);
        const prev = previousRecord(history.filter((r) => r.id !== recordId), period);
        // Sector comparison needs all bakeries; bakery users are not allowed to
        // read other bakeries, so degrade gracefully if the query is denied.
        let sector = null;
        try {
          const sectorRecords = (await listCompletedByPeriod(period)).filter((r) => r.id !== recordId);
          sector = sectorRecords.length ? averageScores(sectorRecords.map((r) => r.scores)) : null;
        } catch {
          sector = null;
        }
        if (bakery) {
          await processCompletedRecord({
            record: { id: recordId, bakeryId, formId, formVersion: fullForm.form.version, period, periodType: "monthly", status, responses, scores, createdBy: user!.uid, createdAt: null, updatedAt: null },
            recordId, bakery,
            previousScores: prev?.scores ?? null,
            sectorScores: sector, questions: fullForm.questions, config,
          });
        }
      }
      navigate(ROUTES.recordDetail(recordId));
    } catch (e) {
      setFormMsg(e instanceof Error ? e.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Registro de información" subtitle="Diligencia un diagnóstico por panadería y periodo" />
      <Card className="mb-4">
        <CardBody className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Select
            label="Panadería *" placeholder="Selecciona panadería"
            value={bakeryId} onChange={(e) => setBakeryId(e.target.value)}
            options={bakeries.map((b) => ({ value: b.id, label: b.businessName }))}
          />
          <Select
            label="Formulario activo *" placeholder="Selecciona formulario"
            value={formId} onChange={(e) => setFormId(e.target.value)}
            options={(data?.forms ?? []).map((f) => ({ value: f.id, label: `${f.name} (v${f.version})` }))}
          />
          <Input label="Periodo (YYYY-MM) *" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2026-06" />
        </CardBody>
      </Card>

      {formMsg && <div className="mb-3"><InlineAlert tone="warning">{formMsg}</InlineAlert></div>}

      {!formId && <InlineAlert tone="info">Selecciona un formulario activo para comenzar.</InlineAlert>}
      {formId && !fullForm && <LoadingSpinner label="Cargando formulario..." />}

      {fullForm && (
        <>
          {liveScores && (
            <Card className="mb-4">
              <CardBody className="flex flex-wrap gap-4 text-sm">
                <span>Productiva: <b>{liveScores.productive?.toFixed(2) ?? "—"}</b></span>
                <span>Administrativa: <b>{liveScores.administrative?.toFixed(2) ?? "—"}</b></span>
                <span>Comercial: <b>{liveScores.commercial?.toFixed(2) ?? "—"}</b></span>
                <span>Global: <b className="text-brand-700">{liveScores.global?.toFixed(2) ?? "—"}</b></span>
                <span className="text-gray-400">(cálculo en vivo)</span>
              </CardBody>
            </Card>
          )}
          <DynamicFormRenderer
            form={fullForm}
            answers={answers}
            errors={errors}
            onChange={(qid, v) => setAnswers((a) => ({ ...a, [qid]: v }))}
          />
          <Card className="mt-4">
            <CardBody>
              <Textarea
                label="Observaciones generales del registro"
                value={(answers["__observations"] as string) ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, __observations: e.target.value }))}
              />
            </CardBody>
          </Card>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" loading={saving} onClick={() => save("draft")}>
              <Save size={16} /> Guardar borrador
            </Button>
            <Button loading={saving} onClick={() => save("completed")}>
              <CheckCircle2 size={16} /> Finalizar y calcular
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
