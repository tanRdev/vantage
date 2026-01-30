'use client'

import { DataTable } from '../data-table'
import type { Column } from '../data-table'
import { StatusIndicator } from '../ui/status-indicator'
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

interface BundleTableProps {
  data?: BundleMetric[]
}

export function BundleTable({ data }: BundleTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <MonoText className="text-xs">NO BUNDLE DATA AVAILABLE. RUN 'VANTAGE CHECK' TO GENERATE METRICS.</MonoText>
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
      data={data}
      columns={columns}
      searchable
      searchKeys={['chunkName', 'status']}
      emptyMessage="NO BUNDLE DATA AVAILABLE. RUN 'VANTAGE CHECK' TO GENERATE METRICS."
    />
  )
}
