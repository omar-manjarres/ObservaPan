import { useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card, CardBody, Table, THead, TBody, TH, TR, TD, Badge, Button, Modal,
  Input, Select, LoadingSpinner, EmptyState, InlineAlert,
} from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";
import { listUsers, upsertUserProfile, setUserStatus } from "@/services/userService";
import { listBakeries } from "@/services/bakeryService";
import { logAudit } from "@/services/auditService";
import { ROLES, ROLE_OPTIONS } from "@/constants/roles";
import { formatDate } from "@/utils/dates";
import type { AppUser, Role } from "@/types";

export function UsersPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(async () => {
    const [users, bakeries] = await Promise.all([listUsers(), listBakeries()]);
    return { users, bakeries };
  }, []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [form, setForm] = useState({ uid: "", displayName: "", email: "", role: "surveyor" as Role, bakeryId: "", assigned: [] as string[] });
  const [msg, setMsg] = useState<string | null>(null);

  const nameById = useMemo(() => new Map((data?.bakeries ?? []).map((b) => [b.id, b.businessName])), [data]);

  const openNew = () => {
    setEditing(null);
    setForm({ uid: "", displayName: "", email: "", role: "surveyor", bakeryId: "", assigned: [] });
    setMsg(null); setOpen(true);
  };
  const openEdit = (u: AppUser) => {
    setEditing(u);
    setForm({ uid: u.uid, displayName: u.displayName, email: u.email, role: u.role, bakeryId: u.bakeryId ?? "", assigned: u.assignedBakeryIds ?? [] });
    setMsg(null); setOpen(true);
  };

  const save = async () => {
    if (!form.uid || !form.displayName || !form.email) { setMsg("UID, nombre y correo son obligatorios."); return; }
    await upsertUserProfile({
      uid: form.uid, displayName: form.displayName, email: form.email, role: form.role, status: editing?.status ?? "active",
      bakeryId: form.role === "bakery" ? form.bakeryId : undefined,
      assignedBakeryIds: form.role === "surveyor" ? form.assigned : undefined,
    });
    await logAudit({ userId: user!.uid, userEmail: user!.email, action: editing ? "update" : "create", module: "users", documentId: form.uid, description: `${editing ? "Actualizó" : "Creó"} usuario ${form.email}` });
    setOpen(false); reload();
  };

  const toggle = async (u: AppUser) => {
    await setUserStatus(u.uid, u.status === "active" ? "inactive" : "active");
    await logAudit({ userId: user!.uid, userEmail: user!.email, action: "deactivate", module: "users", documentId: u.uid, description: `Cambió estado de ${u.email}` });
    reload();
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <InlineAlert tone="error">{error}</InlineAlert>;

  return (
    <div>
      <PageHeader title="Usuarios" subtitle="Gestión de usuarios y roles" action={<Button onClick={openNew}><UserPlus size={16} /> Nuevo usuario</Button>} />
      <InlineAlert tone="info">
        El UID debe corresponder al usuario creado en Firebase Authentication. Crea primero la credencial en Authentication y luego registra aquí su perfil y rol.
      </InlineAlert>
      <Card className="mt-4">
        {(data?.users.length ?? 0) === 0 ? (
          <EmptyState title="Sin usuarios" />
        ) : (
          <Table>
            <THead><TR><TH>Nombre</TH><TH>Correo</TH><TH>Rol</TH><TH>Panadería</TH><TH>Estado</TH><TH>Último acceso</TH><TH></TH></TR></THead>
            <TBody>
              {data!.users.map((u) => (
                <TR key={u.uid}>
                  <TD className="font-medium">{u.displayName}</TD>
                  <TD>{u.email}</TD>
                  <TD><Badge tone="brand">{ROLES[u.role]}</Badge></TD>
                  <TD>{u.bakeryId ? nameById.get(u.bakeryId) ?? "—" : (u.assignedBakeryIds?.length ? `${u.assignedBakeryIds.length} asignada(s)` : "—")}</TD>
                  <TD><Badge tone={u.status === "active" ? "success" : "neutral"}>{u.status === "active" ? "Activo" : "Inactivo"}</Badge></TD>
                  <TD>{u.lastLoginAt ? formatDate(u.lastLoginAt) : "—"}</TD>
                  <TD>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>Editar</Button>
                      <Button size="sm" variant="ghost" onClick={() => toggle(u)}>{u.status === "active" ? "Desactivar" : "Activar"}</Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Modal open={open} title={editing ? "Editar usuario" : "Nuevo usuario"} onClose={() => setOpen(false)}
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={save}>Guardar</Button></>}>
        <div className="space-y-3">
          {msg && <InlineAlert tone="warning">{msg}</InlineAlert>}
          <Input label="UID de Firebase Auth" value={form.uid} disabled={!!editing} onChange={(e) => setForm({ ...form, uid: e.target.value })} />
          <Input label="Nombre" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
          <Input label="Correo" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Select label="Rol" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} options={ROLE_OPTIONS} />
          {form.role === "bakery" && (
            <Select label="Panadería asociada" placeholder="Selecciona" value={form.bakeryId} onChange={(e) => setForm({ ...form, bakeryId: e.target.value })}
              options={(data?.bakeries ?? []).map((b) => ({ value: b.id, label: b.businessName }))} />
          )}
          {form.role === "surveyor" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Panaderías asignadas</label>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border p-2">
                {(data?.bakeries ?? []).map((b) => (
                  <label key={b.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.assigned.includes(b.id)}
                      onChange={(e) => setForm({ ...form, assigned: e.target.checked ? [...form.assigned, b.id] : form.assigned.filter((x) => x !== b.id) })} />
                    {b.businessName}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
