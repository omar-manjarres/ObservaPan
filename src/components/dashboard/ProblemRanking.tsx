import { Badge } from "@/components/ui";

export function ProblemRanking({
  problems,
}: {
  problems: { label: string; count: number }[];
}) {
  if (problems.length === 0)
    return <p className="text-sm text-gray-500">No se identificaron problemáticas frecuentes.</p>;
  return (
    <ol className="space-y-2">
      {problems.map((p, i) => (
        <li key={p.label} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-start gap-2">
            <span className="font-semibold text-brand-600">{i + 1}.</span>
            <span className="text-gray-700">{p.label}</span>
          </span>
          <Badge tone="critical">{p.count}</Badge>
        </li>
      ))}
    </ol>
  );
}
