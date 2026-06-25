import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Wheat } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button, Input, InlineAlert } from "@/components/ui";
import { ROUTES } from "@/constants/routes";

const schema = z.object({
  email: z.string().email("Ingresa un correo válido."),
  password: z.string().min(1, "La contraseña es obligatoria."),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { signIn, user } = useAuth();
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

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      await signIn(values.email, values.password);
      navigate(ROUTES.dashboard, { replace: true });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Error al iniciar sesión.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-100 to-beige p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <Wheat size={28} />
          </div>
          <h1 className="text-2xl font-bold text-brand-900">ObservaPan</h1>
          <p className="text-sm text-gray-500">
            Observatorio Empresarial del Sector Panadero de Valledupar
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && <InlineAlert tone="error">{formError}</InlineAlert>}
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="correo@ejemplo.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />
          <Button type="submit" loading={isSubmitting} className="w-full">
            Iniciar sesión
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          <Link to={ROUTES.forgotPassword} className="text-brand-600 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
          <p className="mt-3 text-gray-500">
            ¿Tu panadería es nueva?{" "}
            <Link to={ROUTES.register} className="font-medium text-brand-600 hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
