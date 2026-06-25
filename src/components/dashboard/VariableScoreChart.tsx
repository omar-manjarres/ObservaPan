import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { VARIABLE_LABELS, VARIABLE_COLORS } from "@/constants/variables";
import type { VariableScores } from "@/types";

export function VariableScoreChart({ scores }: { scores: VariableScores }) {
  const data = (["productive", "administrative", "commercial"] as const).map((k) => ({
    name: VARIABLE_LABELS[k],
    value: scores[k] ?? 0,
    color: VARIABLE_COLORS[k],
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v: number) => v.toFixed(2)} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
