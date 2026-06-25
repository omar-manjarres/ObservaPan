import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-beige text-center">
      <p className="text-6xl font-bold text-brand-300">404</p>
      <p className="text-gray-600">La página que buscas no existe.</p>
      <Link to={ROUTES.dashboard} className="text-brand-600 hover:underline">
        Ir al dashboard
      </Link>
    </div>
  );
}
