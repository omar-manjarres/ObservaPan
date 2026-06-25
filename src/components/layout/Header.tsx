import { Menu, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";
import { initials } from "@/utils/formatters";

export function Header({ onMenu }: { onMenu: () => void }) {
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-brand-100 bg-white/90 px-4 py-3 backdrop-blur">
      <button className="lg:hidden text-brand-700" onClick={onMenu} aria-label="Menú">
        <Menu />
      </button>
      <div className="hidden lg:block">
        <p className="text-sm font-semibold text-gray-800">
          Observatorio Empresarial del Sector Panadero
        </p>
        <p className="text-xs text-gray-500">Valledupar · Cesar</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-800">{user?.displayName}</p>
          <p className="text-xs text-brand-600">{user ? ROLES[user.role] : ""}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
          {initials(user?.displayName)}
        </div>
        <button
          onClick={() => signOut()}
          className="rounded-lg p-2 text-gray-500 hover:bg-brand-50 hover:text-brand-700"
          title="Cerrar sesión"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
