import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Wheat } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { register as registerAuth, authErrorMessage } from "@/services/authService";
import { upsertUserProfile, setUserBakery } from "@/services/userService";
import { createBakery } from "@/services/bakeryService";
import { logAudit } from "@/services/auditService";
import { Button, Input, InlineAlert } from "@/components/ui";
import { ROUTES } from "@/constants/routes";

const schema = z
  .object({
    businessName: z.string().min(2, "Ingresa el nombre de la panadería."),
    ownerName: z.string().min(2, "Ingresa el nombre del responsable."),
    email: z.string().email("Ingresa un correo válido."),
    phone: z.string().optional(),
    neighborhood: z.string().optional(),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Las contraseñas no coinciden.",
    path: ["confirm"],
  });
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (user) navigate(ROUTES.dashboard, { replace: true });
  }, [user, navigate]);

  const onSubmit = async (v: FormValues) => {
    setFormError(null);
    try {
      // 1. Create the auth credential (signs the user in).
      const uid = await registerAuth(v.email, v.password);
      // 2. Create the user profile as an active bakery user (no bakery yet).
      await upsertUserProfile({
        uid,
        displayName: v.ownerName,
        email: v.email,
        role: "bakery",
        status: "active",
      });
      // 3. Create the bakery owned by this user.
      const bakeryId = await createBakery({
        businessName: v.businessName,
        ownerName: v.ownerName,
        phone: v.phone || undefined,
        neighborhood: v.neighborhood || undefined,
        city: "Valledupar",
        department: "Cesar",
        status: "active",
        createdBy: uid,
      });
      // 4. Link the bakery to the user profile.
      await setUserBakery(uid, bakeryId);
      await logAudit({
        userId: uid,
        userEmail: v.email,
        action: "create",
        module: "auth",
        documentId: bakeryId,
        description: `Auto-registro de panadería ${v.businessName}`,
      });
      // 5. Load the freshly created profile, then enter the app.
      await refresh();
      navigate(ROUTES.dashboard, { replace: true });
    } catch (e) {
      const code = (e as { code?: string }).code;
      setFormError(
        code ? authErrorMessage(code) : "No se pudo completar el registro. Intenta de nuevo.",
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-100 to-beige p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <Wheat size={28} />
          </div>
          <h1 className="text-2xl font-bold text-brand-900">Registra tu panadería</h1>
          <p className="text-sm text-gray-500">
            Crea tu cuenta y comienza a diligenciar tu diagnóstico empresarial.
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {formError && (
            <div className="md:col-span-2">
              <InlineAlert tone="error">{formError}</InlineAlert>
            </div>
          )}
          <Input label="Nombre de la panadería *" error={errors.businessName?.message} {...register("businessName")} />
          <Input label="Responsable *" error={errors.ownerName?.message} {...register("ownerName")} />
          <Input label="Correo electrónico *" type="email" error={errors.email?.message} {...register("email")} />
          <Input label="Teléfono" {...register("phone")} />
          <Input label="Barrio" {...register("neighborhood")} />
          <div className="hidden md:block" />
          <Input label="Contraseña *" type="password" error={errors.password?.message} {...register("password")} />
          <Input label="Confirmar contraseña *" type="password" error={errors.confirm?.message} {...register("confirm")} />
          <div className="md:col-span-2">
            <Button type="submit" loading={isSubmitting} className="w-full">
              Crear cuenta y panadería
            </Button>
          </div>
        </form>
        <div className="mt-4 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <Link to={ROUTES.login} className="text-brand-600 hover:underline">
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
