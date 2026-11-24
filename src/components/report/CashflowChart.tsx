"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { LocalityMetrics } from "@/types";
import { formatINR } from "@/lib/format";

// Categorical slots validated for the dark surface (dataviz palette: blue, orange, aqua).
const SERIES = ["#3987e5", "#d95926", "#199e70"];
const AXIS = { stroke: "#1e2733", tick: { fill: "#8b98a8", fontSize: 11 } };
const TOOLTIP = {
  contentStyle: { background: "#121821", border: "1px solid #1e2733", borderRadius: 8, fontSize: 12, color: "#e6edf3" },
  labelStyle: { color: "#8b98a8" },
  cursor: { fill: "rgba(139,152,168,0.08)" },
};
const money = (v: number) => formatINR(v);

export default function CashflowChart({ metrics }: { metrics: LocalityMetrics[] }) {
  const [active, setActive] = useState(metrics[0]?.slug);
  const m = metrics.find((x) => x.slug === active) ?? metrics[0];

  const bars = m.cashflow.map((c) => ({ year: `Y${c.year}`, "EMI outflow": c.emi, Rent: c.rent }));
  const lines = m.cashflow.map((_, i) => {
    const row: Record<string, number | string> = { year: `Y${i + 1}` };
    metrics.forEach((x) => (row[x.locality] = x.cashflow[i].cumulative_net));
    return row;
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <p className="mr-auto text-sm font-medium">Annual EMI vs rent</p>
          {metrics.map((x) => (
            <button
              key={x.slug}
              onClick={() => setActive(x.slug)}
              className={`rounded-full border px-2.5 py-1 text-xs ${x.slug === m.slug ? "border-accent text-accent" : "border-line text-muted hover:text-ink"}`}
            >
              {x.locality}
            </button>
          ))}
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars} barGap={2} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#1e2733" />
              <XAxis dataKey="year" {...AXIS} tickLine={false} />
              <YAxis {...AXIS} tickLine={false} axisLine={false} tickFormatter={money} width={64} />
              <Tooltip {...TOOLTIP} formatter={(v) => formatINR(Number(v))} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#8b98a8" }} />
              <Bar dataKey="Rent" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={22} />
              <Bar dataKey="EMI outflow" fill={SERIES[1]} radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-medium">Cumulative net cashflow (rent − EMI − maintenance)</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lines} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#1e2733" />
              <XAxis dataKey="year" {...AXIS} tickLine={false} />
              <YAxis {...AXIS} tickLine={false} axisLine={false} tickFormatter={money} width={64} />
              <Tooltip {...TOOLTIP} cursor={{ stroke: "#8b98a8", strokeDasharray: "3 3" }} formatter={(v) => formatINR(Number(v))} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#8b98a8" }} />
              {metrics.map((x, i) => (
                <Line key={x.slug} type="monotone" dataKey={x.locality} stroke={SERIES[i]} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: "#0d1117" }} activeDot={{ r: 5 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
