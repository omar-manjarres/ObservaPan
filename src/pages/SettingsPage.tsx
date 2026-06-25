import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardBody, Button, Input, Select, LoadingSpinner, InlineAlert } from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";
import { getConfig, saveConfig } from "@/services/configService";
import { logAudit } from "@/services/auditService";
import type { AppConfig } from "@/types";

export function SettingsPage() {
  const { user } = useAuth();
  const { data, loading, error } = useAsync(() => getConfig(), []);
  const [cfg, setCfg] = useState<AppConfig | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (data) setCfg(data); }, [data]);

  if (loading || !cfg) return <LoadingSpinner />;
  if (error) return <InlineAlert tone="error">{error}</InlineAlert>;

  const save = async () => {
    setSaving(true); setMsg(null);
    await saveConfig({
      institutionName: cfg.institutionName,
      activePeriod: cfg.activePeriod,
      alertThresholds: cfg.alertThresholds,
      reportSettings: cfg.reportSettings,
    });
    await logAudit({ userId: user!.uid, userEmail: user!.email, action: "update", module: "settings", description: "Actualizó configuración general" });
    setSaving(false); setMsg("Configuración guardada correctamente.");
  };

  return (
    <div>
      <PageHeader title="Configuración" subtitle="Parámetros generales del observatorio" />
      {msg && <div className="mb-3"><InlineAlert tone="success">{msg}</InlineAlert></div>}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="General" />
          <CardBody className="space-y-3">
            <Input label="Nombre institucional" value={cfg.institutionName ?? ""} onChange={(e) => setCfg({ ...cfg, institutionName: e.target.value })} />
            <Input label="Periodo activo (YYYY-MM)" value={cfg.activePeriod} onChange={(e) => setCfg({ ...cfg, activePeriod: e.target.value })} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Umbrales de alerta" subtitle="Escala de interpretación de puntajes" />
          <CardBody className="space-y-3">
            <Input label="Riesgo alto por debajo de" type="number" step="0.1" value={cfg.alertThresholds.highRiskBelow}
              onChange={(e) => setCfg({ ...cfg, alertThresholds: { ...cfg.alertThresholds, highRiskBelow: Number(e.target.value) } })} />
            <Input label="Riesgo medio por debajo de" type="number" step="0.1" value={cfg.alertThresholds.mediumRiskBelow}
              onChange={(e) => setCfg({ ...cfg, alertThresholds: { ...cfg.alertThresholds, mediumRiskBelow: Number(e.target.value) } })} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Reportes" />
          <CardBody className="space-y-3">
            <Select label="Datos en reportes sectoriales"
              value={cfg.reportSettings.anonymizeSectorReports ? "anon" : "real"}
              onChange={(e) => setCfg({ ...cfg, reportSettings: { anonymizeSectorReports: e.target.value === "anon" } })}
              options={[{ value: "real", label: "Mostrar nombres reales" }, { value: "anon", label: "Datos anonimizados" }]} />
          </CardBody>
        </Card>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={save} loading={saving}><Save size={16} /> Guardar configuración</Button>
      </div>
    </div>
  );
}
