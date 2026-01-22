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
  // Combine all metrics into a single array for the chart
  const chartData = data?.lcp?.length
    ? data.lcp.map((item, index) => ({
        date: item.date || new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        lcp: data.lcp[index]?.value || 0,
        inp: (data.inp[index]?.value || 0) / 100, // Convert ms to s for display
        cls: data.cls[index]?.value || 0,
      }))
    : [
        { date: 'No data', lcp: 0, inp: 0, cls: 0 },
      ]

  return (
    <div className="w-full h-80" role="img" aria-label="Performance trends chart showing LCP, INP, and CLS over time">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            itemStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Area
            type="monotone"
            dataKey="lcp"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.2}
            name="LCP (s)"
          />
          <Area
            type="monotone"
            dataKey="inp"
            stroke="hsl(var(--success))"
            fill="hsl(var(--success))"
            fillOpacity={0.2}
            name="INP (s)"
          />
          <Area
            type="monotone"
            dataKey="cls"
            stroke="hsl(var(--warning))"
            fill="hsl(var(--warning))"
            fillOpacity={0.2}
            name="CLS"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
