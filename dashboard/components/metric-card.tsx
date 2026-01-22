'use client'

import { Card, CardContent } from './ui/card'
import { StatusPill } from './ui/status-pill'
import { MonoText } from './ui/mono-text'
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
  status?: 'success' | 'warning' | 'critical' | 'purple' | 'neutral'
  className?: string
}

const statusGlowMap = {
  success: 'glow-success',
  warning: 'glow-warning',
  critical: 'glow-critical',
  purple: 'glow-purple',
  neutral: '',
} as const

export function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  status = 'neutral',
  className,
}: MetricCardProps) {
  const glowClass = statusGlowMap[status]

  return (
    <Card className={cn('relative overflow-hidden', glowClass, className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <MonoText as="p" className="text-xs text-muted-foreground mb-0.5">
              {label}
            </MonoText>
          </div>
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon className="h-4 w-4 text-muted-foreground/70" strokeWidth={1.5} />
            )}
            <StatusPill status={status} />
          </div>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums tracking-tight">
            {value}
          </span>
          {unit && (
            <MonoText as="span" className="text-xs text-muted-foreground">
              {unit}
            </MonoText>
          )}
        </div>

        {trend && (
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className={cn(
                'text-xs font-medium tabular-nums',
                trend.isPositive ? 'text-status-success' : 'text-status-critical'
              )}
            >
              {trend.isPositive ? '↓' : '↑'} {Math.abs(trend.value)}%
            </span>
            <MonoText as="span" className="text-xs text-muted-foreground/70">
              FROM LAST
            </MonoText>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
