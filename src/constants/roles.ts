import type { Role } from "@/types";

export const ROLES: Record<Role, string> = {
  admin: "Administrador",
  surveyor: "Encuestador",
  bakery: "Panadería",
  consultant: "Consultor / Investigador",
};

export const ROLE_OPTIONS: { value: Role; label: string }[] = (
  Object.keys(ROLES) as Role[]
).map((r) => ({ value: r, label: ROLES[r] }));
