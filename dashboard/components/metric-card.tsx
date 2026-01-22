'use client'

import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  icon?: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  status?: 'success' | 'warning' | 'error' | 'neutral'
  className?: string
}

export function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  status = 'neutral',
  className,
}: MetricCardProps) {
  const statusColors = {
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    error: 'bg-error/10 text-error border-error/20',
    neutral: 'bg-muted text-muted-foreground border-border',
  }

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        {trend && (
          <div
            className={cn(
              'mt-2 text-xs font-medium',
              trend.isPositive ? 'text-success' : 'text-error'
            )}
          >
            {trend.isPositive ? '↓' : '↑'} {Math.abs(trend.value)}% from last week
          </div>
        )}
        {status && status !== 'neutral' && (
          <Badge
            variant={status === 'success' ? 'success' : status === 'warning' ? 'warning' : 'destructive'}
            className="absolute top-4 right-4"
          >
            {status}
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
