'use client'

import { useEffect, useState } from 'react'
import { TrendChart } from '../components/charts/TrendChart'
import { BundleTable } from '../components/charts/BundleTable'
import { RouteTable } from '../components/charts/RouteTable'
import { BundleTrendChart } from '../components/charts/BundleTrendChart'
import { MetricCard } from '../components/metric-card'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Loader2, Activity, Package, GitBranch } from 'lucide-react'
import { api } from '@/lib/api-client'
import { DataLoader } from '../components/data-loader'
import { ExportButton } from '../components/export-button'
import { RefreshCw } from 'lucide-react'
import type { BundleTrendDataPoint } from '@/types/api'

interface TrendData {
  lcp: Array<{ timestamp: number; value: number; date?: string }>
  inp: Array<{ timestamp: number; value: number; date?: string }>
  cls: Array<{ timestamp: number; value: number; date?: string }>
}

interface StatsData {
  lcp?: number
  inp?: number
  cls?: number
  score?: number
  bundle?: number
}

interface BundleTrendData {
  [chunkName: string]: BundleTrendDataPoint[]
}

export default function Home() {
  const [trends, setTrends] = useState<TrendData | null>(null)
  const [bundleTrends, setBundleTrends] = useState<BundleTrendData | null>(null)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) setIsRefreshing(true)
      const [metricsRes, bundleTrendsRes, statsRes] = await Promise.all([
        api.getMetrics({ limit: 30 }),
        api.getBundleTrends({ limit: 50 }),
        api.getStats(),
      ])

      if (metricsRes.success && metricsRes.data) {
        setTrends(metricsRes.data)
      }

      if (bundleTrendsRes.success && bundleTrendsRes.data) {
        setBundleTrends(bundleTrendsRes.data)
      }

      if (statsRes.success && statsRes.data) {
        setStats({
          lcp: statsRes.data.latestMetrics?.lcp,
          inp: statsRes.data.latestMetrics?.inp,
          cls: statsRes.data.latestMetrics?.cls,
          score: statsRes.data.latestMetrics?.score,
          bundle: statsRes.data.latestBundleSize,
        })
      }

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Performance Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor your application&apos;s performance and bundle size over time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-card border border-border hover:bg-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <DataLoader
        data={stats}
        error={error ?? undefined}
        isLoading={isLoading}
        loadingComponent={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        {(statsData) => {
          const lcpStatus = statsData.lcp != null
            ? statsData.lcp < 2.5 ? 'success' : statsData.lcp < 4 ? 'warning' : 'error'
            : undefined

          const inpStatus = statsData.inp != null
            ? statsData.inp < 200 ? 'success' : statsData.inp < 500 ? 'warning' : 'error'
            : undefined

          const clsStatus = statsData.cls != null
            ? statsData.cls < 0.1 ? 'success' : statsData.cls < 0.25 ? 'warning' : 'error'
            : undefined

          const bundleStatus = statsData.bundle != null
            ? statsData.bundle < 200 * 1024 ? 'success' : statsData.bundle < 500 * 1024 ? 'warning' : 'error'
            : undefined

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Largest Contentful Paint"
                value={statsData.lcp?.toFixed(1) ?? '—'}
                unit="s"
                icon={Activity}
                status={lcpStatus}
              />
              <MetricCard
                label="Interaction to Next Paint"
                value={statsData.inp?.toFixed(0) ?? '—'}
                unit="ms"
                icon={Activity}
                status={inpStatus}
              />
              <MetricCard
                label="Cumulative Layout Shift"
                value={statsData.cls?.toFixed(3) ?? '—'}
                icon={Activity}
                status={clsStatus}
              />
              <MetricCard
                label="Bundle Size"
                value={statsData.bundle ? (statsData.bundle / 1024).toFixed(0) : '—'}
                unit="KB"
                icon={Package}
                status={bundleStatus}
              />
            </div>
          )
        }}
      </DataLoader>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trends */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <DataLoader
              data={trends}
              error={error ?? undefined}
              isLoading={isLoading}
              loadingComponent={
                <div className="h-80 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              }
            >
              {(trendData) => <TrendChart data={trendData} />}
            </DataLoader>
          </CardContent>
        </Card>

        {/* Bundle Analysis */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Bundle Analysis</CardTitle>
            <ExportButton data={[]} filename="bundles" />
          </CardHeader>
          <CardContent>
            <BundleTable />
          </CardContent>
        </Card>
      </div>

      {/* Bundle Size Trends */}
      <BundleTrendChart
        data={bundleTrends ?? undefined}
        isLoading={isLoading}
        error={error ?? undefined}
      />

      {/* Route Performance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Route Performance
          </CardTitle>
          <ExportButton data={[]} filename="routes" />
        </CardHeader>
        <CardContent>
          <RouteTable />
        </CardContent>
      </Card>
    </div>
  )
}
