'use client'

import * as React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Input } from './ui/input'
import { StatusIndicator } from './ui/status-indicator'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: string
  render?: (value: any, row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  searchKeys?: (keyof T)[]
  emptyMessage?: string
  className?: string
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  searchKeys,
  emptyMessage = 'No data available',
  className,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState('')

  const filteredData = React.useMemo(() => {
    if (!searchQuery || !searchKeys) return data

    const query = searchQuery.toLowerCase()
    return data.filter((row) =>
      searchKeys.some((key) => {
        const value = row[key]
        return value?.toString().toLowerCase().includes(query)
      })
    )
  }, [data, searchQuery, searchKeys])

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
    if (status === 'pass') return 'success'
    if (status === 'fail') return 'error'
    if (status === 'warn') return 'warning'
    return 'neutral'
  }

  return (
    <div className={cn('space-y-4', className)}>
      {searchable && searchKeys && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-muted-foreground py-8"
                >
                  {searchQuery ? 'No results found' : emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render ? (
                        column.render(row[column.key], row)
                      ) : column.key === 'status' ? (
                        <StatusIndicator
                          status={getStatusVariant(row[column.key])}
                          label={row[column.key]}
                        />
                      ) : (
                        String(row[column.key] ?? '')
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {filteredData.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredData.length} of {data.length} items
        </div>
      )}
    </div>
  )
}
