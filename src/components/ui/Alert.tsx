import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

type Tone = "success" | "error" | "warning" | "info";
const cfg: Record<Tone, { cls: string; icon: ReactNode }> = {
  success: { cls: "bg-green-50 text-green-800 border-green-200", icon: <CheckCircle2 size={18} /> },
  error: { cls: "bg-red-50 text-red-800 border-red-200", icon: <XCircle size={18} /> },
  warning: { cls: "bg-yellow-50 text-yellow-800 border-yellow-200", icon: <AlertCircle size={18} /> },
  info: { cls: "bg-blue-50 text-blue-800 border-blue-200", icon: <Info size={18} /> },
};

export function InlineAlert({ tone = "info", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${cfg[tone].cls}`}>
      <span className="mt-0.5">{cfg[tone].icon}</span>
      <div>{children}</div>
    </div>
  );
}
