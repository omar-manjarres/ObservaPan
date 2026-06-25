import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui";
import { ROUTES } from "@/constants/routes";

export function ProtectedRoute() {
  const { loading, user } = useAuth();
  if (loading) return <LoadingSpinner label="Verificando sesión..." />;
  if (!user) return <Navigate to={ROUTES.login} replace />;
  if (user.status === "inactive")
    return (
      <div className="flex h-screen items-center justify-center p-6 text-center">
        <p className="text-gray-600">
          Tu usuario está desactivado. Contacta al administrador del observatorio.
        </p>
      </div>
    );
  return <Outlet />;
}
