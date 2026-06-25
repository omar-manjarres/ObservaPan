import type { ReactNode } from "react";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">{children}</table>
    </div>
  );
}
export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-brand-50 text-left text-xs uppercase tracking-wide text-brand-700">{children}</thead>;
}
export function TH({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-semibold ${className}`}>{children}</th>;
}
export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-gray-100">{children}</tbody>;
}
export function TR({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <tr
      onClick={onClick}
      className={`${onClick ? "cursor-pointer hover:bg-brand-50/60" : ""} ${className}`}
    >
      {children}
    </tr>
  );
}
export function TD({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-gray-700 ${className}`}>{children}</td>;
}
