import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, Button, Input, Select, Textarea, InlineAlert, LoadingSpinner } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useAsync } from "@/hooks/useAsync";
import { getBakery, createBakery, updateBakery, type BakeryInput } from "@/services/bakeryService";
import { logAudit } from "@/services/auditService";
import { ROUTES } from "@/constants/routes";

const schema = z.object({
  businessName: z.string().min(2, "Nombre obligatorio."),
  ownerName: z.string().min(2, "Propietario obligatorio."),
  nit: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Correo inválido.").optional().or(z.literal("")),
  address: z.string().optional(),
  neighborhood: z.string().optional(),
  commune: z.string().optional(),
  startYear: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal("")),
  employeeCount: z.coerce.number().int().min(0).optional().or(z.literal("")),
  bakeryType: z.string().optional(),
  companySize: z.enum(["micro", "small", "medium"]).optional().or(z.literal("")),
  productionType: z.enum(["artisanal", "semi_industrial", "industrial"]).optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function BakeryFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: existing, loading } = useAsync(
    () => (id ? getBakery(id) : Promise.resolve(null)),
    [id],
  );

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "active" },
  });

  useEffect(() => {
    if (existing) {
      reset({
        businessName: existing.businessName,
        ownerName: existing.ownerName,
        nit: existing.nit ?? "",
        phone: existing.phone ?? "",
        email: existing.email ?? "",
        address: existing.address ?? "",
        neighborhood: existing.neighborhood ?? "",
        commune: existing.commune ?? "",
        startYear: (existing.startYear ?? "") as never,
        employeeCount: (existing.employeeCount ?? "") as never,
        bakeryType: existing.bakeryType ?? "",
        companySize: (existing.companySize ?? "") as never,
        productionType: (existing.productionType ?? "") as never,
        status: existing.status,
        notes: existing.notes ?? "",
      });
    }
  }, [existing, reset]);

  const onSubmit = async (v: FormValues) => {
    const payload: BakeryInput = {
      businessName: v.businessName,
      ownerName: v.ownerName,
      nit: v.nit || undefined,
      phone: v.phone || undefined,
      email: v.email || undefined,
      address: v.address || undefined,
      neighborhood: v.neighborhood || undefined,
      commune: v.commune || undefined,
      city: "Valledupar",
      department: "Cesar",
      startYear: v.startYear ? Number(v.startYear) : undefined,
      employeeCount: v.employeeCount !== "" ? Number(v.employeeCount) : undefined,
      bakeryType: v.bakeryType || undefined,
      companySize: (v.companySize || undefined) as BakeryInput["companySize"],
      productionType: (v.productionType || undefined) as BakeryInput["productionType"],
      status: v.status,
      notes: v.notes || undefined,
      createdBy: existing?.createdBy ?? user!.uid,
    };
    if (isEdit && id) {
      await updateBakery(id, payload);
      await logAudit({ userId: user!.uid, userEmail: user!.email, action: "update", module: "bakeries", documentId: id, description: `Actualizó panadería ${v.businessName}` });
      navigate(ROUTES.bakeryDetail(id));
    } else {
      const newId = await createBakery(payload);
      await logAudit({ userId: user!.uid, userEmail: user!.email, action: "create", module: "bakeries", documentId: newId, description: `Registró panadería ${v.businessName}` });
      navigate(ROUTES.bakeryDetail(newId));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title={isEdit ? "Editar panadería" : "Nueva panadería"} />
      <Card>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Nombre comercial *" error={errors.businessName?.message} {...register("businessName")} />
            <Input label="Propietario / responsable *" error={errors.ownerName?.message} {...register("ownerName")} />
            <Input label="NIT / identificación" {...register("nit")} />
            <Input label="Teléfono" {...register("phone")} />
            <Input label="Correo electrónico" type="email" error={errors.email?.message} {...register("email")} />
            <Input label="Dirección" {...register("address")} />
            <Input label="Barrio" {...register("neighborhood")} />
            <Input label="Comuna / zona" {...register("commune")} />
            <Input label="Año de inicio de operaciones" type="number" {...register("startYear")} />
            <Input label="Número de empleados" type="number" {...register("employeeCount")} />
            <Input label="Tipo de panadería" {...register("bakeryType")} />
            <Select
              label="Tamaño de empresa"
              placeholder="Seleccionar"
              {...register("companySize")}
              options={[
                { value: "micro", label: "Micro" },
                { value: "small", label: "Pequeña" },
                { value: "medium", label: "Mediana" },
              ]}
            />
            <Select
              label="Tipo de producción"
              placeholder="Seleccionar"
              {...register("productionType")}
              options={[
                { value: "artisanal", label: "Artesanal" },
                { value: "semi_industrial", label: "Semiindustrial" },
                { value: "industrial", label: "Industrial" },
              ]}
            />
            <Select
              label="Estado"
              {...register("status")}
              options={[
                { value: "active", label: "Activa" },
                { value: "inactive", label: "Inactiva" },
              ]}
            />
            <div className="md:col-span-2">
              <Textarea label="Observaciones generales" {...register("notes")} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
              <Button type="submit" loading={isSubmitting}>{isEdit ? "Guardar cambios" : "Registrar"}</Button>
            </div>
          </form>
          {isEdit && existing && <InlineAlert tone="info">Los cambios quedan registrados en la auditoría.</InlineAlert>}
        </CardBody>
      </Card>
    </div>
  );
}
