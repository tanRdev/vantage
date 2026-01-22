'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface TrendDataPoint {
  timestamp: number
  value: number
  date?: string
}

interface TrendData {
  lcp: TrendDataPoint[]
  inp: TrendDataPoint[]
  cls: TrendDataPoint[]
}

interface TrendChartProps {
  data?: TrendData
}

export function TrendChart({ data }: TrendChartProps) {
  const chartData = data?.lcp?.length
    ? data.lcp.map((item, index) => ({
        date: item.date || new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        lcp: data.lcp[index]?.value || 0,
        inp: (data.inp[index]?.value || 0) / 100,
        cls: data.cls[index]?.value || 0,
      }))
    : [{ date: 'NO DATA', lcp: 0, inp: 0, cls: 0 }]

  return (
    <div className="w-full h-80" role="img" aria-label="Performance trends chart showing LCP, INP, and CLS over time">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.3}
          />
          <XAxis
            dataKey="date"
            className="text-xs"
            tick={{ fill: 'hsl(var(--text-tertiary))', fontSize: 11 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: 'hsl(var(--text-tertiary))', fontSize: 11 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card) / 0.9)',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              backdropFilter: 'blur(8px)',
              color: 'hsl(var(--text-primary))',
            }}
            itemStyle={{ color: 'hsl(var(--text-primary))' }}
            labelStyle={{ color: 'hsl(var(--text-secondary))' }}
          />
          <Area
            type="monotone"
            dataKey="lcp"
            stroke="hsl(var(--status-success))"
            fill="hsl(var(--status-success))"
            fillOpacity={0.15}
            strokeWidth={2}
            name="LCP (S)"
          />
          <Area
            type="monotone"
            dataKey="inp"
            stroke="hsl(var(--status-purple))"
            fill="hsl(var(--status-purple))"
            fillOpacity={0.15}
            strokeWidth={2}
            name="INP (S)"
          />
          <Area
            type="monotone"
            dataKey="cls"
            stroke="hsl(var(--status-warning))"
            fill="hsl(var(--status-warning))"
            fillOpacity={0.15}
            strokeWidth={2}
            name="CLS"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
