import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { EmptyState } from "@/components/ui";
import { ShieldAlert } from "lucide-react";
import type { Role } from "@/types";

export function RoleGuard({
  roles,
  children,
}: {
  roles: Role[];
  children: ReactNode;
}) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return (
      <EmptyState
        icon={<ShieldAlert size={40} />}
        title="Acceso restringido"
        message="No tienes permisos para acceder a este módulo."
      />
    );
  }
  return <>{children}</>;
}
