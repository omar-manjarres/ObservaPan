import { Card, CardHeader, CardBody, Badge } from "@/components/ui";
import { variableLabel, scoreInterpretation } from "@/utils/formatters";
import type { VariableScores } from "@/types";

export function ReportPreview({
  title,
  period,
  scores,
  notes,
}: {
  title: string;
  period: string;
  scores: VariableScores;
  notes?: string[];
}) {
  return (
    <Card>
      <CardHeader title={title} subtitle={`Periodo: ${period}`} />
      <CardBody className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {(["productive", "administrative", "commercial", "global"] as const).map((k) => (
            <div key={k} className="rounded-lg border border-brand-50 p-3">
              <p className="text-xs uppercase text-gray-500">{variableLabel(k)}</p>
              <p className="text-xl font-bold text-brand-700">
                {scores[k]?.toFixed(2) ?? "—"}
              </p>
              <Badge tone="brand">{scoreInterpretation(scores[k])}</Badge>
            </div>
          ))}
        </div>
        {notes && notes.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
            {notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
