'use client'

import { useEffect, useState } from 'react'
import { DataTable } from '../data-table'
import { api } from '@/lib/api-client'
import type { Column } from '../data-table'
import { StatusIndicator } from '../ui/status-indicator'
import { Loader2 } from 'lucide-react'
import { MonoText } from '../ui/mono-text'
import { cn } from '@/lib/utils'

export interface RouteMetric {
  id: number
  timestamp: number
  branch: string
  commit?: string
  lcp?: number
  inp?: number
  cls?: number
  fcp?: number
  ttfb?: number
  score?: number
  status: 'pass' | 'warn' | 'fail'
}

export function RouteTable() {
  const [routes, setRoutes] = useState<RouteMetric[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getRoutes({ limit: 20 })
      .then((res) => {
        if (res.success && res.data) {
          setRoutes(res.data)
        } else {
          setError(res.error || 'Failed to load routes')
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" strokeWidth={1.5} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <MonoText className="text-xs">{error}</MonoText>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-status-purple hover:underline text-xs"
        >
          RETRY
        </button>
      </div>
    )
  }

  const getScoreStatus = (score: number | undefined) => {
    if (!score) return 'neutral'
    if (score >= 90) return 'success'
    if (score >= 50) return 'warning'
    return 'error'
  }

  const columns: Column<RouteMetric>[] = [
    {
      key: 'branch',
      header: 'BRANCH',
      render: (value) => <MonoText as="span" className="text-sm">{value}</MonoText>,
    },
    {
      key: 'lcp',
      header: 'LCP',
      render: (value) => <MonoText className="tabular-nums">{value ? `${value.toFixed(1)}S` : '—'}</MonoText>,
    },
    {
      key: 'inp',
      header: 'INP',
      render: (value) => <MonoText className="tabular-nums">{value ? `${value.toFixed(0)}MS` : '—'}</MonoText>,
    },
    {
      key: 'cls',
      header: 'CLS',
      render: (value) => <MonoText className="tabular-nums">{value ? value.toFixed(3) : '—'}</MonoText>,
    },
    {
      key: 'score',
      header: 'SCORE',
      render: (value) => {
        const status = getScoreStatus(value)
        const statusMap = { success: 'text-status-success', warning: 'text-status-warning', error: 'text-status-critical', neutral: 'text-muted-foreground' }
        return (
          <MonoText className={cn('tabular-nums', statusMap[status as keyof typeof statusMap])}>
            {value ? `${value.toFixed(0)}` : '—'}
          </MonoText>
        )
      },
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (value) => (
        <StatusIndicator
          status={value === 'pass' ? 'success' : value === 'warn' ? 'warning' : 'error'}
          label={value === 'pass' ? 'OK' : value === 'warn' ? 'WARN' : 'FAIL'}
        />
      ),
    },
    {
      key: 'timestamp',
      header: 'DATE',
      render: (value) => <MonoText className="text-xs">{new Date(Number(value)).toLocaleDateString()}</MonoText>,
    },
  ]

  return (
    <DataTable
      data={routes}
      columns={columns}
      searchable
      searchKeys={['branch', 'status']}
      emptyMessage="NO ROUTE DATA AVAILABLE. RUN 'VANTAGE CHECK' TO GENERATE METRICS."
    />
  )
}
