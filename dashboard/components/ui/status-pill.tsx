import { cn } from '@/lib/utils'

interface StatusPillProps {
  status: 'success' | 'warning' | 'purple' | 'critical' | 'neutral'
  label?: string
  showDot?: boolean
  className?: string
}

const statusConfig = {
  success: {
    dotClass: 'status-dot-success',
    textClass: 'text-status-success',
    glowClass: 'glow-success',
  },
  warning: {
    dotClass: 'status-dot-warning',
    textClass: 'text-status-warning',
    glowClass: 'glow-warning',
  },
  purple: {
    dotClass: 'status-dot-purple',
    textClass: 'text-status-purple',
    glowClass: 'glow-purple',
  },
  critical: {
    dotClass: 'status-dot-critical',
    textClass: 'text-status-critical',
    glowClass: 'glow-critical',
  },
  neutral: {
    dotClass: 'bg-muted-foreground',
    textClass: 'text-muted-foreground',
    glowClass: '',
  },
} as const

export function StatusPill({ status, label, showDot = true, className }: StatusPillProps) {
  const config = statusConfig[status]

  return (
    <div className={cn('inline-flex items-center gap-2', config.glowClass, className)}>
      {showDot && <span className={cn('status-dot', config.dotClass)} />}
      {label && <span className={cn('text-xs font-medium text-all-caps-tight', config.textClass)}>{label}</span>}
    </div>
  )
}
