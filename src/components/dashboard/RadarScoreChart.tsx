import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

export interface RadarSeries {
  name: string;
  color: string;
  values: { productive: number | null; administrative: number | null; commercial: number | null };
}

export function RadarScoreChart({ series }: { series: RadarSeries[] }) {
  const axes = [
    { key: "productive", label: "Productiva" },
    { key: "administrative", label: "Administrativa" },
    { key: "commercial", label: "Comercial" },
  ] as const;
  const data = axes.map((a) => {
    const row: Record<string, number | string> = { axis: a.label };
    series.forEach((s) => (row[s.name] = s.values[a.key] ?? 0));
    return row;
  });
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
        <Tooltip />
        <Legend />
        {series.map((s) => (
          <Radar key={s.name} name={s.name} dataKey={s.name} stroke={s.color} fill={s.color} fillOpacity={0.25} />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
}
