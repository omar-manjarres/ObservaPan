import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Store } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card, CardBody, Table, THead, TBody, TH, TR, TD, Badge, Button,
  Input, Select, LoadingSpinner, EmptyState, InlineAlert,
} from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { listBakeriesScoped } from "@/services/scopedData";
import { useAuth } from "@/hooks/useAuth";
import { canManageBakeries, scopedBakeryIds } from "@/utils/permissions";
import { ROUTES } from "@/constants/routes";

export function BakeriesPage() {
  const { user } = useAuth();
  const { data, loading, error } = useAsync(() => listBakeriesScoped(user), [user]);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [commune, setCommune] = useState("");

  const scope = scopedBakeryIds(user);

  const rows = useMemo(() => {
    if (!data) return [];
    return data
      .filter((b) => scope === null || scope.includes(b.id))
      .filter((b) => b.businessName.toLowerCase().includes(search.toLowerCase()))
      .filter((b) => !status || b.status === status)
      .filter((b) => !commune || b.commune === commune);
  }, [data, search, status, commune, scope]);

  const communes = useMemo(
    () => [...new Set((data ?? []).map((b) => b.commune).filter(Boolean))] as string[],
    [data],
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <InlineAlert tone="error">{error}</InlineAlert>;

  return (
    <div>
      <PageHeader
        title="Panaderías"
        subtitle={`${rows.length} panadería(s)`}
        action={
          canManageBakeries(user) && (
            <Button onClick={() => navigate(ROUTES.newBakery)}>
              <Plus size={16} /> Nueva panadería
            </Button>
          )
        }
      />
      <Card className="mb-4">
        <CardBody className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <Input
              placeholder="Buscar por nombre"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            placeholder="Todos los estados"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: "active", label: "Activa" },
              { value: "inactive", label: "Inactiva" },
            ]}
          />
          <Select
            placeholder="Todas las comunas/zonas"
            value={commune}
            onChange={(e) => setCommune(e.target.value)}
            options={communes.map((c) => ({ value: c, label: c }))}
          />
        </CardBody>
      </Card>

      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={<Store size={40} />} title="No hay panaderías" message="Aún no se han registrado panaderías con estos filtros." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Nombre comercial</TH>
                <TH>Propietario</TH>
                <TH>Barrio / Comuna</TH>
                <TH>Tamaño</TH>
                <TH>Estado</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((b) => (
                <TR key={b.id} onClick={() => navigate(ROUTES.bakeryDetail(b.id))}>
                  <TD className="font-medium text-brand-800">{b.businessName}</TD>
                  <TD>{b.ownerName}</TD>
                  <TD>{[b.neighborhood, b.commune].filter(Boolean).join(" · ") || "—"}</TD>
                  <TD>{b.companySize ?? "—"}</TD>
                  <TD>
                    <Badge tone={b.status === "active" ? "success" : "neutral"}>
                      {b.status === "active" ? "Activa" : "Inactiva"}
                    </Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
