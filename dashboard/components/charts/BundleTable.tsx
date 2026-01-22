'use client'

import { useEffect, useState } from 'react'
import { DataTable } from '../data-table'
import { api } from '@/lib/api-client'
import type { Column } from '../data-table'
import { StatusIndicator } from '../ui/status-indicator'
import { Loader2 } from 'lucide-react'
import { MonoText } from '../ui/mono-text'
import { cn } from '@/lib/utils'

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

  const columns: Column<BundleMetric>[] = [
    {
      key: 'chunkName',
      header: 'CHUNK',
      render: (value) => <MonoText as="span" className="text-sm">{value}</MonoText>,
    },
    {
      key: 'newSize',
      header: 'SIZE',
      render: (value) => (
        <MonoText className="tabular-nums">{Math.round(Number(value) / 1024)}KB</MonoText>
      ),
    },
    {
      key: 'delta',
      header: 'DELTA',
      render: (value) => {
        const numValue = Number(value)
        return (
          <MonoText
            className={cn(
              'tabular-nums',
              numValue > 0
                ? 'text-status-critical'
                : numValue < 0
                ? 'text-status-success'
                : 'text-muted-foreground'
            )}
          >
            {numValue > 0 ? '+' : ''}{Math.round(numValue / 1024)}KB
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
      data={bundles}
      columns={columns}
      searchable
      searchKeys={['chunkName', 'status']}
      emptyMessage="NO BUNDLE DATA AVAILABLE. RUN 'VANTAGE CHECK' TO GENERATE METRICS."
    />
  )
}
