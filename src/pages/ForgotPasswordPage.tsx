import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Wheat } from "lucide-react";
import { resetPassword, authErrorMessage } from "@/services/authService";
import { Button, Input, InlineAlert } from "@/components/ui";
import { ROUTES } from "@/constants/routes";

const schema = z.object({ email: z.string().email("Ingresa un correo válido.") });
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await resetPassword(values.email);
      setSent(true);
    } catch (e) {
      setError(authErrorMessage((e as { code?: string }).code ?? ""));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-100 to-beige p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <Wheat size={28} />
          </div>
          <h1 className="text-xl font-bold text-brand-900">Recuperar contraseña</h1>
          <p className="text-sm text-gray-500">
            Te enviaremos un enlace para restablecerla.
          </p>
        </div>
        {sent ? (
          <InlineAlert tone="success">
            Si el correo existe, recibirás un enlace de recuperación en breve.
          </InlineAlert>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && <InlineAlert tone="error">{error}</InlineAlert>}
            <Input
              label="Correo electrónico"
              type="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <Button type="submit" loading={isSubmitting} className="w-full">
              Enviar enlace de recuperación
            </Button>
          </form>
        )}
        <div className="mt-4 text-center text-sm">
          <Link to={ROUTES.login} className="text-brand-600 hover:underline">
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
