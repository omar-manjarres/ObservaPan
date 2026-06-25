import type { ReactNode } from "react";
import { Card } from "@/components/ui";

export function KpiCard({
  label,
  value,
  icon,
  tone = "brand",
  hint,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: "brand" | "success" | "warning" | "critical";
  hint?: string;
}) {
  const toneCls = {
    brand: "text-brand-600 bg-brand-50",
    success: "text-green-600 bg-green-50",
    warning: "text-yellow-600 bg-yellow-50",
    critical: "text-red-600 bg-red-50",
  }[tone];
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">{value}</p>
          {hint && <p className="text-xs text-gray-400">{hint}</p>}
        </div>
        {icon && <div className={`rounded-lg p-2 ${toneCls}`}>{icon}</div>}
      </div>
    </Card>
  );
}
