"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CapitalRatioRow, CapitalRatioValueKey } from "@/lib/regulatoryCompliance/capitalRatios";

type Props = {
  data: CapitalRatioRow[];
  actualKey: CapitalRatioValueKey;
  targetKey: CapitalRatioValueKey;
  actualLabel: string;
  targetLabel: string;
  title: string;
  color: "primary" | "success";
};

function formatPercent(value: unknown): string {
  return typeof value === "number" ? `${value.toFixed(2)}%` : "–";
}

export function RatioChart({ data, actualKey, targetKey, actualLabel, targetLabel, title, color }: Props) {
  const actualColor = `hsl(var(--${color}))`;
  const targetColor = "hsl(var(--muted))";

  // Hoechster Ist-Wert erhaelt die Beschriftung im Chart.
  let maxIndex = -1;
  let maxValue = -Infinity;
  data.forEach((row, index) => {
    const value = row[actualKey];
    if (value !== null && value > maxValue) {
      maxValue = value;
      maxIndex = index;
    }
  });

  return (
    <div className="rounded-3xl border border-border/70 bg-surface/70 p-6 shadow-lg dark:border-border/40">
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      <div role="img" aria-label={title} className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 28, right: 24, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="quarter" tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} tick={{ fill: "hsl(var(--muted))", fontSize: 12 }} />
            <YAxis
              tickFormatter={(value: number) => `${value}%`}
              tickLine={false}
              axisLine={false}
              width={56}
              domain={[0, "auto"]}
              tick={{ fill: "hsl(var(--muted))", fontSize: 12 }}
            />
            <Tooltip
              formatter={(value, name) => [formatPercent(value), name]}
              contentStyle={{
                backgroundColor: "hsl(var(--surface))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem",
                color: "hsl(var(--text))",
              }}
              labelStyle={{ color: "hsl(var(--muted))" }}
            />
            <Legend verticalAlign="top" align="right" iconType="plainline" wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted))" }} />
            <Line
              type="monotone"
              name={actualLabel}
              dataKey={actualKey}
              stroke={actualColor}
              strokeWidth={2.5}
              connectNulls
              dot={false}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
              label={(props: { x?: number | string; y?: number | string; index?: number; value?: unknown }) => {
                const x = Number(props.x);
                const y = Number(props.y);
                if (props.index !== maxIndex || !Number.isFinite(x) || !Number.isFinite(y)) {
                  return null;
                }
                return (
                  <g>
                    <circle cx={x} cy={y} r={4} fill={actualColor} />
                    <text x={x} y={y - 12} textAnchor="middle" fontSize={12} fontWeight={600} style={{ fill: actualColor }}>
                      {formatPercent(props.value)}
                    </text>
                  </g>
                );
              }}
            />
            <Line
              type="monotone"
              name={targetLabel}
              dataKey={targetKey}
              stroke={targetColor}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              connectNulls
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
