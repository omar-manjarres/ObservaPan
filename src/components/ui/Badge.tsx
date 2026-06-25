import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "critical" | "info" | "brand";

const tones: Record<Tone, string> = {
  neutral: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  critical: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  brand: "bg-brand-100 text-brand-800",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
