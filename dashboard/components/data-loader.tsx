'use client'

import { ReactNode } from 'react'
import { Skeleton } from './ui/skeleton'
import { Alert, AlertDescription } from './ui/alert'
import { Button } from './ui/button'

interface DataLoaderProps<T> {
  data: T | null | undefined
  error?: string | null
  isLoading: boolean
  children: (data: NonNullable<T>) => ReactNode
  loadingComponent?: ReactNode
  errorComponent?: (error: string, retry: () => void) => ReactNode
  onRetry?: () => void
}

export function DataLoader<T>({
  data,
  error,
  isLoading,
  children,
  loadingComponent,
  errorComponent,
  onRetry,
}: DataLoaderProps<T>) {
  if (isLoading) {
    return (
      loadingComponent || (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )
    )
  }

  if (error) {
    return (
      errorComponent?.(error, onRetry || (() => window.location.reload())) || (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-col items-center gap-4">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry || (() => window.location.reload())}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )
    )
  }

  if (data == null) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        No data available. Run <code className="mx-1">vantage check</code> to generate metrics.
      </div>
    )
  }

  return <>{children(data)}</>
}
