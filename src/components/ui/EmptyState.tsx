import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title = "Sin datos",
  message,
  icon,
  action,
}: {
  title?: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <div className="text-brand-300">{icon ?? <Inbox size={40} />}</div>
      <h4 className="font-semibold text-gray-700">{title}</h4>
      {message && <p className="max-w-sm text-sm text-gray-500">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
