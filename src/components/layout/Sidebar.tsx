import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Users,
  FileStack,
  ClipboardList,
  Gauge,
  GitCompareArrows,
  Bell,
  FileBarChart,
  Settings,
  ScrollText,
  Wheat,
  X,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import type { Role } from "@/types";
import { useAuth } from "@/hooks/useAuth";

interface Item {
  to: string;
  label: string;
  icon: typeof Store;
  roles: Role[];
}

const ALL: Role[] = ["admin", "surveyor", "bakery", "consultant"];

const ITEMS: Item[] = [
  { to: ROUTES.dashboard, label: "Dashboard", icon: LayoutDashboard, roles: ALL },
  { to: ROUTES.bakeries, label: "Panaderías", icon: Store, roles: ["admin", "surveyor", "consultant", "bakery"] },
  { to: ROUTES.records, label: "Registros", icon: ClipboardList, roles: ["admin", "surveyor", "bakery", "consultant"] },
  { to: ROUTES.indicators, label: "Indicadores", icon: Gauge, roles: ALL },
  { to: ROUTES.comparisons, label: "Comparaciones", icon: GitCompareArrows, roles: ALL },
  { to: ROUTES.alerts, label: "Alertas", icon: Bell, roles: ALL },
  { to: ROUTES.reports, label: "Reportes", icon: FileBarChart, roles: ["admin", "consultant", "bakery"] },
  { to: ROUTES.forms, label: "Formularios", icon: FileStack, roles: ["admin"] },
  { to: ROUTES.users, label: "Usuarios", icon: Users, roles: ["admin"] },
  { to: ROUTES.audit, label: "Auditoría", icon: ScrollText, roles: ["admin"] },
  { to: ROUTES.settings, label: "Configuración", icon: Settings, roles: ["admin"] },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const items = ITEMS.filter((i) => user && i.roles.includes(user.role));

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-brand-800 text-brand-50 transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <Wheat className="text-gold" />
            <div>
              <p className="text-lg font-bold leading-none">ObservaPan</p>
              <p className="text-[10px] text-brand-200">Observatorio Panadero</p>
            </div>
          </div>
          <button className="lg:hidden" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <nav className="mt-2 space-y-1 px-3 pb-6">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-brand-600 font-medium text-white"
                    : "text-brand-100 hover:bg-brand-700"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
