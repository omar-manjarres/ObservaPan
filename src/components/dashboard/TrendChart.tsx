import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { VARIABLE_COLORS, VARIABLE_LABELS } from "@/constants/variables";

export interface TrendPoint {
  period: string;
  productive?: number | null;
  administrative?: number | null;
  commercial?: number | null;
  global?: number | null;
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="period" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        {(["productive", "administrative", "commercial", "global"] as const).map((k) => (
          <Line
            key={k}
            type="monotone"
            dataKey={k}
            name={VARIABLE_LABELS[k]}
            stroke={VARIABLE_COLORS[k]}
            strokeWidth={k === "global" ? 3 : 2}
            dot={{ r: 2 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
