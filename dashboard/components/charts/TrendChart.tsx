"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function TrendChart() {
  const data = [
    { date: "Jan 15", lcp: 2.1, inp: 60, cls: 0.08 },
    { date: "Jan 16", lcp: 2.0, inp: 55, cls: 0.07 },
    { date: "Jan 17", lcp: 1.9, inp: 50, cls: 0.06 },
    { date: "Jan 18", lcp: 1.8, inp: 45, cls: 0.05 },
    { date: "Jan 19", lcp: 1.7, inp: 40, cls: 0.04 },
  ];

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="lcp"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.3}
            name="LCP (s)"
          />
          <Area
            type="monotone"
            dataKey="inp"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.3}
            name="INP (ms)"
          />
          <Area
            type="monotone"
            dataKey="cls"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.3}
            name="CLS"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
