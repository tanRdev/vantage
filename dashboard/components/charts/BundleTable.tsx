'use client'

import { useEffect, useState } from 'react'
import { DataTable } from '../data-table'
import { api } from '@/lib/api-client'
import type { Column } from '../data-table'
import { Badge } from '../ui/badge'
import { StatusIndicator } from '../ui/status-indicator'
import { Loader2 } from 'lucide-react'

export interface BundleMetric {
  id: number
  timestamp: number
  branch: string
  commit?: string
  chunkName: string
  oldSize?: number
  newSize: number
  delta: number
  status: 'pass' | 'warn' | 'fail'
}

export function BundleTable() {
  const [bundles, setBundles] = useState<BundleMetric[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getBundles({ limit: 20 })
      .then((res) => {
        if (res.success && res.data) {
          setBundles(res.data)
        } else {
          setError(res.error || 'Failed to load bundles')
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

  const columns: Column<BundleMetric>[] = [
    {
      key: 'chunkName',
      header: 'Chunk',
      render: (value) => <span className="font-mono text-sm">{value}</span>,
    },
    {
      key: 'newSize',
      header: 'Size',
      render: (value) => `${Math.round(value / 1024)}KB`,
    },
    {
      key: 'delta',
      header: 'Delta',
      render: (value) => (
        <span
          className={
            value > 0
              ? 'text-error'
              : value < 0
              ? 'text-success'
              : 'text-muted-foreground'
          }
        >
          {value > 0 ? '+' : ''}{Math.round(value / 1024)}KB
        </span>
      ),
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
      data={bundles}
      columns={columns}
      searchable
      searchKeys={['chunkName', 'status']}
      emptyMessage="No bundle data available. Run 'vantage check' to generate metrics."
    />
  )
}
