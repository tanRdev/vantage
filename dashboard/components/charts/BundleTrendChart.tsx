'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Loader2 } from 'lucide-react'

export interface BundleTrendDataPoint {
  timestamp: number
  value: number
  date?: string
}

export interface BundleTrendData {
  [chunkName: string]: BundleTrendDataPoint[]
}

interface BundleTrendChartProps {
  data?: BundleTrendData
  isLoading?: boolean
  error?: string | null
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--chart-1, 250 100% 60%))',
  'hsl(var(--chart-2, 200 100% 60%))',
  'hsl(var(--chart-3, 150 100% 60%))',
  'hsl(var(--chart-4, 300 100% 60%))',
  'hsl(var(--chart-5, 25 100% 60%))',
]

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function BundleTrendChart({ data, isLoading, error }: BundleTrendChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bundle Size Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bundle Size Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || Object.keys(data).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bundle Size Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            <p>No bundle trend data available. Run metrics collection to see trends.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get all unique timestamps for the x-axis
  const allTimestamps = new Set<number>()
  for (const chunk in data) {
    for (const point of data[chunk]) {
      allTimestamps.add(point.timestamp)
    }
  }

  // Sort timestamps and create chart data
  const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b)

  const chartData = sortedTimestamps.map(timestamp => {
    const point: any = {
      date: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }

    for (const chunk in data) {
      const chunkPoint = data[chunk].find(p => p.timestamp === timestamp)
      if (chunkPoint) {
        point[chunk] = chunkPoint.value
      }
    }

    return point
  })

  // Get top chunks by average size (limit to 5 for readability)
  const chunkAvgSizes = Object.entries(data).map(([chunk, points]) => {
    const avg = points.reduce((sum, p) => sum + p.value, 0) / points.length
    return { chunk, avg }
  }).sort((a, b) => b.avg - a.avg).slice(0, 5)

  const topChunks = chunkAvgSizes.map(c => c.chunk)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Bundle Size Trends (Top 5 Chunks)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-80" role="img" aria-label="Bundle size trends chart showing chunk sizes over time">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={formatBytes}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => formatBytes(value)}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                iconType="line"
              />
              {topChunks.map((chunk, index) => (
                <Line
                  key={chunk}
                  type="monotone"
                  dataKey={chunk}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name={chunk}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
