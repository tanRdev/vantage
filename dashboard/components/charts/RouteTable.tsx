'use client'

import { useEffect, useState } from 'react'
import { DataTable } from '../data-table'
import { api } from '@/lib/api-client'
import type { Column } from '../data-table'
import { Badge } from '../ui/badge'
import { StatusIndicator } from '../ui/status-indicator'
import { Loader2 } from 'lucide-react'

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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-primary hover:underline"
        >
          Retry
        </button>
      </div>
    )
  }

  const columns: Column<RouteMetric>[] = [
    {
      key: 'branch',
      header: 'Branch',
      render: (value) => <span className="font-mono text-sm">{value}</span>,
    },
    {
      key: 'lcp',
      header: 'LCP',
      render: (value) => (value ? `${value.toFixed(1)}s` : '—'),
    },
    {
      key: 'inp',
      header: 'INP',
      render: (value) => (value ? `${value.toFixed(0)}ms` : '—'),
    },
    {
      key: 'cls',
      header: 'CLS',
      render: (value) => (value ? value.toFixed(3) : '—'),
    },
    {
      key: 'score',
      header: 'Score',
      render: (value) => (value ? `${value.toFixed(0)}` : '—'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <StatusIndicator
          status={value === 'pass' ? 'success' : value === 'warn' ? 'warning' : 'error'}
          label={value === 'pass' ? 'OK' : value === 'warn' ? 'Warning' : 'Failed'}
        />
      ),
    },
    {
      key: 'timestamp',
      header: 'Date',
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ]

  return (
    <DataTable
      data={routes}
      columns={columns}
      searchable
      searchKeys={['branch', 'status']}
      emptyMessage="No route data available. Run 'vantage check' to generate metrics."
    />
  )
}
